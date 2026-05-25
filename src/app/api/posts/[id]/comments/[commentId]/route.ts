import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true, status: true },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.postId !== id) {
      return NextResponse.json(
        { message: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    // Only the comment author can edit
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Can't edit deleted/hidden comments
    if (comment.status === "DELETED" || comment.status === "HIDDEN") {
      return NextResponse.json(
        { message: "Cannot edit this comment" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content } = updateSchema.parse(body);

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
        _count: { select: { likes: true } },
      },
    });

    return NextResponse.json({ ...updated, liked: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 422 }
      );
    }

    console.error("PATCH comment error:", error);
    return NextResponse.json(
      { message: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true, status: true },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.postId !== id) {
      return NextResponse.json(
        { message: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    // Comment author, post author, or admin can delete
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    const isAuthor = comment.authorId === session.user.id;
    const isPostAuthor = post?.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isPostAuthor && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Soft delete - mark as deleted but keep for moderation history
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: "DELETED",
        content: "[deleted]",
      },
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("DELETE comment error:", error);
    return NextResponse.json(
      { message: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

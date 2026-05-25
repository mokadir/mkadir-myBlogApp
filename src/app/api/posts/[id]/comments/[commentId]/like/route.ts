import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
      select: { id: true, postId: true, status: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.status === "DELETED" || comment.status === "HIDDEN") {
      return NextResponse.json(
        { message: "Cannot like this comment" },
        { status: 400 }
      );
    }

    // Check if already liked
    const existing = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ liked: true, message: "Already liked" }, { status: 409 });
    }

    await prisma.commentLike.create({
      data: {
        commentId,
        userId: session.user.id,
      },
    });

    const count = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ liked: true, count });
  } catch (error) {
    console.error("POST comment like error:", error);
    return NextResponse.json(
      { message: "Failed to like comment" },
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

    const existing = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ liked: false, message: "Not liked yet" }, { status: 404 });
    }

    await prisma.commentLike.delete({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    const count = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({ liked: false, count });
  } catch (error) {
    console.error("DELETE comment like error:", error);
    return NextResponse.json(
      { message: "Failed to unlike comment" },
      { status: 500 }
    );
  }
}

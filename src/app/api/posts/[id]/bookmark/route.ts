import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already bookmarked" },
        { status: 409 }
      );
    }

    await prisma.bookmark.create({
      data: {
        postId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error("POST bookmark error:", error);
    return NextResponse.json(
      { message: "Failed to bookmark post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Not bookmarked yet" },
        { status: 404 }
      );
    }

    await prisma.bookmark.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ bookmarked: false });
  } catch (error) {
    console.error("DELETE bookmark error:", error);
    return NextResponse.json(
      { message: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}

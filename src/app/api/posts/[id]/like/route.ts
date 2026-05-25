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

    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already liked" },
        { status: 409 }
      );
    }

    await prisma.like.create({
      data: {
        postId: id,
        userId: session.user.id,
      },
    });

    const count = await prisma.like.count({
      where: { postId: id },
    });

    return NextResponse.json({ liked: true, count });
  } catch (error) {
    console.error("POST like error:", error);
    return NextResponse.json(
      { message: "Failed to like post" },
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

    const existing = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Not liked yet" },
        { status: 404 }
      );
    }

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    const count = await prisma.like.count({
      where: { postId: id },
    });

    return NextResponse.json({ liked: false, count });
  } catch (error) {
    console.error("DELETE like error:", error);
    return NextResponse.json(
      { message: "Failed to unlike post" },
      { status: 500 }
    );
  }
}

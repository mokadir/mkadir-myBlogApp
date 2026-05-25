import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "FLAGGED";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where =
      status === "ALL"
        ? { status: { not: "DELETED" as const } }
        : { status: status as "FLAGGED" | "HIDDEN" | "ACTIVE" };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true, role: true, isBanned: true },
          },
          post: {
            select: { id: true, title: true, slug: true },
          },
          _count: { select: { likes: true, replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("GET moderation comments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { commentId, action } = body;

    if (!commentId || !action) {
      return NextResponse.json(
        { message: "commentId and action are required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve":
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            status: "ACTIVE",
            flaggedBy: null,
            flaggedAt: null,
          },
        });
        return NextResponse.json({ message: "Comment approved" });

      case "hide":
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            status: "HIDDEN",
            hiddenBy: session.user.id,
            hiddenAt: new Date(),
          },
        });
        return NextResponse.json({ message: "Comment hidden" });

      case "delete":
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            status: "DELETED",
            content: "[deleted by moderator]",
          },
        });
        return NextResponse.json({ message: "Comment deleted" });

      case "ban_user":
        // Hide all comments by this user and ban them
        await prisma.$transaction([
          prisma.comment.updateMany({
            where: { authorId: comment.authorId },
            data: { status: "HIDDEN" },
          }),
          prisma.user.update({
            where: { id: comment.authorId },
            data: {
              isBanned: true,
              banReason: body.reason || "Abusive behavior",
              bannedAt: new Date(),
            },
          }),
        ]);
        return NextResponse.json({ message: "User banned and comments hidden" });

      default:
        return NextResponse.json(
          { message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("PATCH moderation error:", error);
    return NextResponse.json(
      { message: "Failed to moderate comment" },
      { status: 500 }
    );
  }
}

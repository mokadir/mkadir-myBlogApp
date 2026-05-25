import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long")
    .refine(
      (val) => !/(<script|javascript:|on\w+\s*=)/i.test(val),
      "Invalid content detected"
    ),
  parentId: z.string().optional(),
});

// Spam detection - simple checks
function isSpam(content: string): boolean {
  const spamPatterns = [
    /buy\s+now/i,
    /click\s+here/i,
    /free\s+money/i,
    /https?:\/\/[^\s]{20,}/, // Very long URLs
    /(.)\1{20,}/, // Repeated characters
  ];
  return spamPatterns.some((pattern) => pattern.test(content));
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const sort = url.searchParams.get("sort") || "newest";

    const skip = (page - 1) * limit;

    const orderBy:
      | { createdAt: "desc" | "asc" }
      | { likes: { _count: "desc" } } =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "popular"
          ? { likes: { _count: "desc" } }
          : { createdAt: "desc" };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId: id,
          parentId: null, // Only top-level comments
          status: { not: "DELETED" },
        },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          replies: {
            where: { status: { not: "DELETED" } },
            include: {
              author: {
                select: { id: true, name: true, image: true, role: true },
              },
              _count: { select: { likes: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          postId: id,
          parentId: null,
          status: { not: "DELETED" },
        },
      }),
    ]);

    // Get current user's liked comment IDs
    const session = await getServerSession(authOptions);
    let likedCommentIds: string[] = [];
    if (session?.user?.id) {
      const likes = await prisma.commentLike.findMany({
        where: {
          userId: session.user.id,
          commentId: {
            in: comments.flatMap((c) => [
              c.id,
              ...c.replies.map((r) => r.id),
            ]),
          },
        },
        select: { commentId: true },
      });
      likedCommentIds = likes.map((l) => l.commentId);
    }

    // Map comments to include liked status
    const mappedComments = comments.map((comment) => ({
      ...comment,
      liked: likedCommentIds.includes(comment.id),
      replies: comment.replies.map((reply) => ({
        ...reply,
        liked: likedCommentIds.includes(reply.id),
      })),
    }));

    return NextResponse.json({
      comments: mappedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true, banReason: true },
    });

    if (user?.isBanned) {
      return NextResponse.json(
        {
          message: `You have been banned from commenting. ${
            user.banReason ? `Reason: ${user.banReason}` : ""
          }`,
        },
        { status: 403 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, parentId } = commentSchema.parse(body);

    // If replying, verify parent comment exists and belongs to this post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, parentId: true },
      });

      if (!parentComment || parentComment.postId !== id) {
        return NextResponse.json(
          { message: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Only allow one level of nesting (replies to top-level comments only)
      if (parentComment.parentId) {
        return NextResponse.json(
          { message: "Cannot reply to a reply" },
          { status: 400 }
        );
      }
    }

    // Spam check
    const detectedAsSpam = isSpam(content);
    const commentStatus = detectedAsSpam ? "FLAGGED" : "ACTIVE";

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        authorId: session.user.id,
        parentId: parentId || null,
        status: commentStatus,
        ...(detectedAsSpam
          ? { flaggedBy: "system", flaggedAt: new Date() }
          : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, role: true },
        },
        _count: { select: { likes: true } },
      },
    });

    if (detectedAsSpam) {
      return NextResponse.json(
        {
          ...comment,
          liked: false,
          message:
            "Your comment has been flagged for review and will appear once approved.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { ...comment, liked: false, replies: [] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 422 }
      );
    }

    console.error("POST comment error:", error);
    return NextResponse.json(
      { message: "Failed to create comment" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations/post";
import { slugify, calculateReadTime } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 12;
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    } else if (!searchParams.get("status")) {
      // Default: show published posts for public, all for dashboard
      where.status = "PUBLISHED";
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: any =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "updated"
        ? { updatedAt: "desc" }
        : sort === "title"
        ? { title: "asc" }
        : { createdAt: "desc" };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          category: true,
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error("GET posts error:", error);
    return NextResponse.json(
      { message: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !canWrite(session.user.role)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = postSchema.parse(body);

    const slug = body.slug || slugify(data.title);
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    const finalSlug = existingPost ? `${slug}-${Date.now()}` : slug;

    const post = await prisma.post.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        slug: finalSlug,
        content: data.content,
        excerpt: data.excerpt || null,
        coverImage: data.coverImage || null,
        tags: data.tags,
        categoryId: data.categoryId && data.categoryId !== "" ? data.categoryId : null,
        status: data.status,
        featured: data.featured,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        readTime: calculateReadTime(data.content),
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 422 }
      );
    }

    console.error("POST post error:", error);
    return NextResponse.json(
      { message: "Failed to create post" },
      { status: 500 }
    );
  }
}
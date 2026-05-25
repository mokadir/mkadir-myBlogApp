import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/posts/post-card";
import { PostListSkeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Blog Posts",
  description: "Explore all blog posts on ModernBlog",
};

interface PostsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function PostsList({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const tag = params.tag;
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">No posts found</h3>
        <p className="text-sm text-muted-foreground">
          Check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <a
                key={pageNum}
                href={`/posts?page=${pageNum}${tag ? `&tag=${tag}` : ""}`}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  pageNum === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {pageNum}
              </a>
            )
          )}
        </div>
      )}
    </>
  );
}

export default function PostsPage(props: PostsPageProps) {
  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Posts</h1>
        <p className="mt-2 text-muted-foreground">
          Discover articles from our community
        </p>
      </div>

      <Suspense fallback={<PostListSkeleton />}>
        <PostsList {...props} />
      </Suspense>
    </div>
  );
}
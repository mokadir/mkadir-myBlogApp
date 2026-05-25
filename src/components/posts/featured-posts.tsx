import { prisma } from "@/lib/prisma";
import { PostCard } from "./post-card";

export async function FeaturedPosts() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">No featured posts yet</h3>
        <p className="text-sm text-muted-foreground">
          Featured posts will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
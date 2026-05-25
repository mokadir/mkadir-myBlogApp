import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getInitials } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface RelatedPostsProps {
  currentPostId: string;
  categoryId?: string | null;
  tags: string[];
  limit?: number;
}

export async function RelatedPosts({
  currentPostId,
  categoryId,
  tags,
  limit = 3,
}: RelatedPostsProps) {
  // Find related posts by shared tags or same category
  const relatedPosts = await prisma.post.findMany({
    where: {
      id: { not: currentPostId },
      status: "PUBLISHED",
      OR: [
        ...(categoryId ? [{ categoryId }] : []),
        ...(tags.length > 0 ? [{ tags: { hasSome: tags } }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      readTime: true,
      createdAt: true,
      author: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  if (relatedPosts.length === 0) return null;

  return (
    <section className="mt-16" aria-label="Related posts">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Related Posts</h2>
        <Link
          href="/posts"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <Link key={post.id} href={`/posts/${post.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
              {post.coverImage ? (
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <span className="text-4xl font-bold text-primary/20">
                    {post.title.charAt(0)}
                  </span>
                </div>
              )}
              <CardContent className="p-4">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(post.author.name || "A")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                  <span>·</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

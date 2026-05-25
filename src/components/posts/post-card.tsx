import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate, getInitials, truncate } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface PostCardProps {
  post: PostWithAuthor;
  variant?: "default" | "compact" | "featured";
}

export function PostCard({ post, variant = "default" }: PostCardProps) {
  if (variant === "featured") {
    return (
      <Link href={`/posts/${post.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-xl border">
          {post.coverImage ? (
            <div className="relative h-64 md:h-80">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 md:h-80">
              <span className="text-4xl font-bold text-primary/20">
                {post.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            <div className="mb-2 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/20 text-white">
                  {tag}
                </Badge>
              ))}
            </div>
            <h3 className="mb-2 text-2xl font-bold">{post.title}</h3>
            <p className="mb-4 text-sm text-white/80">
              {post.excerpt ? truncate(post.excerpt, 150) : truncate(post.content, 150)}
            </p>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime || "5"} min read
              </span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border transition-all hover:shadow-md">
        {post.coverImage ? (
          <div className="relative h-48">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-3xl font-bold text-primary/20">
              {post.title.charAt(0)}
            </span>
          </div>
        )}

        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-primary">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(post.author.name || "A")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {post.author.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {post._count && (
                <>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {post._count.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post._count.comments}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
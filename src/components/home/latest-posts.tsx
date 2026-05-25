"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Heart, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getInitials, truncate } from "@/lib/utils";
import { useAnimateOnView } from "@/lib/hooks/use-animate-on-view";
import type { PostWithAuthor } from "@/types";

interface LatestPostsProps {
  posts: PostWithAuthor[];
}

function PostCardSkeleton() {
  return (
    <div className="rounded-xl border p-4">
      <Skeleton className="mb-3 h-40 w-full rounded-lg" />
      <Skeleton className="mb-2 h-4 w-16" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-3 h-4 w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function LatestPostsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="border-t py-20">
      <div className="container">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LatestPosts({ posts }: LatestPostsProps) {
  const [ref, isVisible] = useAnimateOnView();

  return (
    <section ref={ref} className="border-t py-20">
      <div className="container">
        <motion.div
          className="mb-12 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl font-bold">Latest Articles</h2>
            <p className="mt-2 text-muted-foreground">
              Fresh content from our community
            </p>
          </div>
          <Link href="/posts">
            <button className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
              View All Posts <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </motion.div>

        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No posts published yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <motion.div
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  {/* Cover Image */}
                  {post.coverImage ? (
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-5xl font-bold text-primary/20">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Tags */}
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={post.author.image || ""} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(post.author.name || "A")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <p className="font-medium">{post.author.name}</p>
                          <p className="text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {post._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post._count.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post._count.comments}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile view all */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Posts <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
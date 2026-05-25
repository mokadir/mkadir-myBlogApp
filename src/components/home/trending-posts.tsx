"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, Heart, MessageCircle, Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials, truncate } from "@/lib/utils";
import { useAnimateOnView } from "@/lib/hooks/use-animate-on-view";
import type { PostWithAuthor } from "@/types";

interface TrendingPostsProps {
  posts: PostWithAuthor[];
}

export function TrendingPosts({ posts }: TrendingPostsProps) {
  const [ref, isVisible] = useAnimateOnView();

  if (posts.length === 0) {
    return (
      <section className="border-t py-20">
        <div className="container">
          <div className="flex items-center gap-2 mb-8">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-3xl font-bold">Trending</h2>
          </div>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No trending posts yet.</p>
          </div>
        </div>
      </section>
    );
  }

  // Sort by likes for trending
  const sortedPosts = [...posts].sort(
    (a, b) => (b._count?.likes || 0) - (a._count?.likes || 0)
  );
  const topPosts = sortedPosts.slice(0, 4);

  return (
    <section ref={ref} className="border-t py-20">
      <div className="container">
        <motion.div
          className="mb-8 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold">Trending Now</h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {topPosts.map((post, index) => (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <motion.div
                className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Rank number */}
                  <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                    {index + 1}
                  </div>

                  {/* Image */}
                  {post.coverImage && (
                    <div className="relative h-40 w-full shrink-0 sm:h-auto sm:w-48">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-5">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="mb-2 line-clamp-2 text-base font-semibold transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>

                    <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">
                      {post.excerpt || truncate(post.content, 100)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author.image || ""} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(post.author.name || "A")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {post.author.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post._count?.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/posts?sort=popular"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Trending <TrendingUp className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
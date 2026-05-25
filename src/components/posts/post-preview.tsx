"use client";

import Image from "next/image";
import { Clock, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

interface PostPreviewProps {
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  authorName?: string;
  authorImage?: string;
  publishedAt?: Date | string;
}

export function PostPreview({
  title,
  subtitle,
  content,
  excerpt,
  coverImage,
  tags = [],
  readTime = 5,
  authorName = "Author",
  authorImage,
  publishedAt,
}: PostPreviewProps) {
  return (
    <article className="mx-auto max-w-3xl">
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="mb-6 text-xl text-muted-foreground">{subtitle}</p>
      )}

      {/* Meta */}
      <div className="mb-8 flex items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={authorName}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <AvatarFallback className="text-xs">
                {getInitials(authorName)}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium">{authorName}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readTime} min read
          </span>
          {publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(publishedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {coverImage && (
        <div className="relative mb-8 h-64 overflow-hidden rounded-xl md:h-80">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Excerpt */}
      {excerpt && (
        <p className="mb-8 text-lg italic text-muted-foreground border-l-4 border-primary/20 pl-4">
          {excerpt}
        </p>
      )}

      {/* Content */}
      {content ? (
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">
            Start writing to see your preview...
          </p>
        </div>
      )}
    </article>
  );
}
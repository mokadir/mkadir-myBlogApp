import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials } from "@/lib/utils";
import { ReadingProgress } from "@/components/posts/reading-progress";
import { TableOfContents } from "@/components/posts/table-of-contents";
import { ShareButtons } from "@/components/posts/share-buttons";
import { LikeButton } from "@/components/posts/like-button";
import { BookmarkButton } from "@/components/posts/bookmark-button";
import { CommentsSection } from "@/components/posts/comments-section";
import { RelatedPosts } from "@/components/posts/related-posts";
import { ArrowLeft, Clock, User } from "lucide-react";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || post.title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: undefined,
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: {
        select: { id: true, name: true, image: true, bio: true },
      },
      category: {
        select: { id: true, name: true, slug: true, color: true },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
  });

  if (!post) notFound();

  // Check if current user has liked/bookmarked this post
  let userLiked = false;
  let userBookmarked = false;

  if (session?.user?.id) {
    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: session.user.id,
          },
        },
      }),
      prisma.bookmark.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: session.user.id,
          },
        },
      }),
    ]);
    userLiked = !!like;
    userBookmarked = !!bookmark;
  }

  // Fetch comments for this post
  const comments = await prisma.comment.findMany({
    where: { postId: post.id, parentId: null, status: { not: "DELETED" } },
    include: {
      author: {
        select: { id: true, name: true, image: true, role: true },
      },
      _count: {
        select: { likes: true },
      },
      replies: {
        where: { status: { not: "DELETED" } },
        include: {
          author: {
            select: { id: true, name: true, image: true, role: true },
          },
          _count: {
            select: { likes: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if current user has liked these comments
  const commentsWithLikes = await Promise.all(
    comments.map(async (comment) => {
      const liked = session?.user?.id
        ? !!(await prisma.commentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId: session.user.id,
              },
            },
          }))
        : false;

      const repliesWithLikes = await Promise.all(
        comment.replies.map(async (reply) => {
          const replyLiked = session?.user?.id
            ? !!(await prisma.commentLike.findUnique({
                where: {
                  commentId_userId: {
                    commentId: reply.id,
                    userId: session.user.id,
                  },
                },
              }))
            : false;

          return {
            ...reply,
            liked: replyLiked,
          };
        })
      );

      return {
        ...comment,
        liked,
        replies: repliesWithLikes,
      };
    })
  );

  const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/posts/${post.slug}`;

  return (
    <>
      <ReadingProgress />

      <article className="container py-8 md:py-12">
        {/* Back Button */}
        <Link
          href="/posts"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to posts
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="relative mb-8 h-64 overflow-hidden rounded-xl md:h-96">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 800px"
                />
              </div>
            )}

            {/* Post Header */}
            <div className="mx-auto max-w-3xl">
              {/* Category & Tags */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {post.category && (
                  <Link href={`/posts?category=${post.category.slug}`}>
                    <Badge
                      style={{
                        backgroundColor: `${post.category.color || "#6366f1"}15`,
                        color: post.category.color || "#6366f1",
                        borderColor: `${post.category.color || "#6366f1"}30`,
                      }}
                      className="border"
                    >
                      {post.category.name}
                    </Badge>
                  </Link>
                )}
                {post.tags.slice(0, 3).map((tag) => (
                  <Link key={tag} href={`/posts?tag=${tag}`}>
                    <Badge variant="secondary" className="cursor-pointer">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Title */}
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              {/* Subtitle */}
              {post.subtitle && (
                <p className="mb-6 text-lg text-muted-foreground md:text-xl">
                  {post.subtitle}
                </p>
              )}

              {/* Author & Meta */}
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-background">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback>
                      {getInitials(post.author.name || "A")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.author.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime || "5"} min read
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <LikeButton
                    postId={post.id}
                    initialLikes={post._count.likes}
                    initialLiked={userLiked}
                  />
                  <BookmarkButton
                    postId={post.id}
                    initialBookmarked={userBookmarked}
                  />
                  <ShareButtons
                    url={absoluteUrl}
                    title={post.title}
                    description={post.excerpt || undefined}
                  />
                </div>
              </div>

              {/* Post Content */}
              <div
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags Footer */}
              {post.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tags:
                  </span>
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/posts?tag=${tag}`}>
                      <Badge variant="outline" className="cursor-pointer">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-4">
                  <LikeButton
                    postId={post.id}
                    initialLikes={post._count.likes}
                    initialLiked={userLiked}
                  />
                  <BookmarkButton
                    postId={post.id}
                    initialBookmarked={userBookmarked}
                  />
                </div>
                <ShareButtons
                  url={absoluteUrl}
                  title={post.title}
                  description={post.excerpt || undefined}
                />
              </div>

              {/* Author Bio */}
              {post.author.bio && (
                <div className="mt-10 rounded-xl border bg-card p-6 transition-colors hover:bg-accent/5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 shrink-0 ring-2 ring-background">
                      <AvatarImage src={post.author.image || ""} />
                      <AvatarFallback className="text-lg">
                        {getInitials(post.author.name || "A")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.author.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          Author
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {post.author.bio}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <Separator className="my-10" />
              <CommentsSection
                postId={post.id}
                postAuthorId={post.authorId}
                initialComments={commentsWithLikes}
                initialCount={post._count.comments}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="toc space-y-8">
              {/* Table of Contents */}
              <TableOfContents content={post.content} />

              {/* Author Mini Card */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Author
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback>
                      {getInitials(post.author.name || "A")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {post.author.name}
                    </p>
                    {post.author.bio && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {post.author.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Share this article
                </h3>
                <ShareButtons
                  url={absoluteUrl}
                  title={post.title}
                  description={post.excerpt || undefined}
                  className="flex-col items-start gap-2"
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        <RelatedPosts
          currentPostId={post.id}
          categoryId={post.categoryId}
          tags={post.tags}
        />
      </article>
    </>
  );
}

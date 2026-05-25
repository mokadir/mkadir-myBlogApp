"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { publishPost, unpublishPost, deletePost } from "@/lib/actions/post";

interface DashboardPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string; slug: string; color?: string } | null;
  tags: string[];
  _count: {
    comments: number;
    likes: number;
  };
}

interface DashboardPostsProps {
  posts: DashboardPost[];
  totalPages?: number;
  currentPage?: number;
}

export function DashboardPosts({
  posts,
  totalPages = 1,
  currentPage = 1,
}: DashboardPostsProps) {
  const router = useRouter();

  async function handlePublish(postId: string) {
    try {
      await publishPost(postId);
      toast.success("Post published!");
      router.refresh();
    } catch {
      toast.error("Failed to publish post");
    }
  }

  async function handleUnpublish(postId: string) {
    try {
      await unpublishPost(postId);
      toast.success("Post unpublished");
      router.refresh();
    } catch {
      toast.error("Failed to unpublish post");
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone."))
      return;

    try {
      await deletePost(postId);
      toast.success("Post deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete post");
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">No posts found</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Create your first blog post to get started.
        </p>
        <Link href="/dashboard/new">
          <Button>Create Your First Post</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">
                  Category
                </th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">
                  Date
                </th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">
                  Stats
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="truncate font-medium">{post.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        /posts/{post.slug}
                      </p>
                      {post.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        post.status === "PUBLISHED"
                          ? "default"
                          : post.status === "DRAFT"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        post.status === "ARCHIVED"
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      {post.status === "PUBLISHED"
                        ? "Published"
                        : post.status === "DRAFT"
                        ? "Draft"
                        : "Archived"}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-sm md:table-cell">
                    {post.category ? (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: post.category.color || undefined,
                        }}
                      >
                        {post.category.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                    {post._count.likes} likes · {post._count.comments} comments
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View published post */}
                      {post.status === "PUBLISHED" && (
                        <Link href={`/posts/${post.slug}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View post"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {/* Publish/Unpublish */}
                      {post.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handlePublish(post.id)}
                          title="Publish"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {post.status === "PUBLISHED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-600"
                          onClick={() => handleUnpublish(post.id)}
                          title="Unpublish"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Edit */}
                      <Link href={`/dashboard/${post.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(post.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/dashboard?page=${currentPage - 1}`}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-accent"
            >
              Previous
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/dashboard?page=${pageNum}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {pageNum}
              </Link>
            )
          )}

          {currentPage < totalPages && (
            <Link
              href={`/dashboard?page=${currentPage + 1}`}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-accent"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
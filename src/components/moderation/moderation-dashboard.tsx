"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getInitials, cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import toast from "react-hot-toast";

interface ModComment {
  id: string;
  content: string;
  status: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    isBanned: boolean;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  _count: {
    likes: number;
    replies: number;
  };
}

export function ModerationDashboard() {
  const { data: session } = useSession();
  const [comments, setComments] = React.useState<ModComment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState("FLAGGED");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchComments = React.useCallback(
    async (pageNum: number, status: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/moderation/comments?page=${pageNum}&limit=20&status=${status}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setComments(data.comments);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch {
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    if (isAdmin) {
      fetchComments(page, statusFilter);
    }
  }, [isAdmin, page, statusFilter, fetchComments]);

  const handleAction = async (
    commentId: string,
    action: string,
    reason?: string
  ) => {
    setActionLoading(`${action}-${commentId}`);
    try {
      const res = await fetch("/api/moderation/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Action failed");
      }

      const data = await res.json();
      toast.success(data.message);
      fetchComments(page, statusFilter);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed"
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Admin access required
          </p>
        </div>
      </div>
    );
  }

  const filteredComments = searchQuery
    ? comments.filter(
        (c) =>
          c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.author.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          c.author.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : comments;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Comment Moderation</h2>
          <p className="text-sm text-muted-foreground">
            {total} comment{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="FLAGGED">
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Flagged
          </TabsTrigger>
          <TabsTrigger value="ACTIVE">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="HIDDEN">
            <EyeOff className="mr-1.5 h-4 w-4" />
            Hidden
          </TabsTrigger>
          <TabsTrigger value="ALL">
            <MessageCircle className="mr-1.5 h-4 w-4" />
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border bg-card p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-4 w-32 rounded bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No {statusFilter.toLowerCase()} comments to review
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {/* Author info */}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={comment.author.image || ""} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(comment.author.name || "A")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {comment.author.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.author.email}
                          </span>
                          <Badge
                            variant={
                              comment.author.role === "ADMIN"
                                ? "default"
                                : "secondary"
                            }
                            className="h-5 text-[10px]"
                          >
                            {comment.author.role}
                          </Badge>
                          {comment.author.isBanned && (
                            <Badge
                              variant="destructive"
                              className="h-5 text-[10px]"
                            >
                              BANNED
                            </Badge>
                          )}
                          <Badge
                            variant={
                              comment.status === "FLAGGED"
                                ? "outline"
                                : comment.status === "HIDDEN"
                                  ? "secondary"
                                  : "default"
                            }
                            className={cn(
                              "h-5 text-[10px]",
                              comment.status === "FLAGGED" &&
                                "border-orange-300 text-orange-600",
                              comment.status === "HIDDEN" &&
                                "border-yellow-300 text-yellow-600"
                            )}
                          >
                            {comment.status}
                          </Badge>
                        </div>

                        {/* Comment content */}
                        <p className="mb-2 text-sm leading-relaxed">
                          {comment.content}
                        </p>

                        {/* Post link & meta */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(comment.createdAt)}</span>
                          <span>·</span>
                          <span>{comment._count.likes} likes</span>
                          <span>·</span>
                          <span>{comment._count.replies} replies</span>
                          <span>·</span>
                          <Link
                            href={`/posts/${comment.post.slug}`}
                            className="truncate text-primary hover:underline"
                            target="_blank"
                          >
                            {comment.post.title}
                          </Link>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-col gap-1.5">
                        {comment.status === "FLAGGED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAction(comment.id, "approve")}
                            disabled={actionLoading === `approve-${comment.id}`}
                          >
                            {actionLoading === `approve-${comment.id}` ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                            )}
                            Approve
                          </Button>
                        )}

                        {comment.status !== "HIDDEN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAction(comment.id, "hide")}
                            disabled={actionLoading === `hide-${comment.id}`}
                          >
                            {actionLoading === `hide-${comment.id}` ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <EyeOff className="mr-1 h-3 w-3" />
                            )}
                            Hide
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this comment? This action cannot be undone."
                              )
                            ) {
                              handleAction(comment.id, "delete");
                            }
                          }}
                          disabled={actionLoading === `delete-${comment.id}`}
                        >
                          {actionLoading === `delete-${comment.id}` ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3 w-3" />
                          )}
                          Delete
                        </Button>

                        {!comment.author.isBanned && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => {
                              const reason = prompt(
                                "Ban reason:",
                                "Abusive behavior"
                              );
                              if (reason) {
                                handleAction(
                                  comment.id,
                                  "ban_user",
                                  reason
                                );
                              }
                            }}
                            disabled={
                              actionLoading === `ban_user-${comment.id}`
                            }
                          >
                            {actionLoading === `ban_user-${comment.id}` ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Ban className="mr-1 h-3 w-3" />
                            )}
                            Ban User
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

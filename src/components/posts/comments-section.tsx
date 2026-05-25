"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials, cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  Heart,
  Reply,
  Edit3,
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
  role?: string;
}

interface ReplyData {
  id: string;
  content: string;
  createdAt: Date;
  isEdited: boolean;
  status: string;
  author: CommentAuthor;
  _count: { likes: number };
  liked: boolean;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  isEdited: boolean;
  status: string;
  author: CommentAuthor;
  _count: { likes: number };
  liked: boolean;
  replies: ReplyData[];
}

interface CommentsSectionProps {
  postId: string;
  postAuthorId?: string;
  initialComments: CommentData[];
  initialCount: number;
  className?: string;
}

// ─── Spam Word Filter ────────────────────────────────────────────────────────

const SPAM_WORDS = [
  /buy\s+now/i,
  /click\s+here/i,
  /free\s+money/i,
  / casino /i,
  /viagra/i,
  /cryptocurrency/i,
];

function containsSpam(text: string): boolean {
  return SPAM_WORDS.some((pattern) => pattern.test(text));
}

// ─── Comment Like Button ─────────────────────────────────────────────────────

function CommentLikeButton({
  commentId,
  postId,
  initialLiked,
  initialCount,
}: {
  commentId: string;
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { data: session } = useSession();
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLike = async () => {
    if (!session) {
      toast.error("Please sign in to like comments");
      return;
    }

    setIsLoading(true);
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${commentId}/like`,
        { method: liked ? "DELETE" : "POST" }
      );
      if (!res.ok && res.status !== 409) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch {
      setLiked(liked);
      setCount(count);
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-1 text-xs transition-colors",
        liked
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-500"
      )}
      aria-label={liked ? "Unlike comment" : "Like comment"}
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5 transition-all",
          liked && "fill-current",
          isLoading && "animate-pulse"
        )}
      />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

// ─── Comment Form ────────────────────────────────────────────────────────────

function CommentForm({
  postId,
  parentId,
  initialValue = "",
  placeholder = "Write a comment...",
  submitLabel = "Post Comment",
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  postId: string;
  parentId?: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const { data: session } = useSession();
  const [content, setContent] = React.useState(initialValue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !session) return;

    if (containsSpam(trimmed)) {
      toast.error("Your comment looks like spam. Please revise.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, parentId);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <Avatar className="mt-1 h-7 w-7 shrink-0">
          <AvatarImage src={session.user.image || ""} />
          <AvatarFallback className="text-[10px]">
            {getInitials(session.user.name || "U")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] resize-none text-sm"
            rows={2}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {session.user.name || session.user.email}
            </p>
            <div className="flex items-center gap-1.5">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="h-7 px-3 text-xs"
                disabled={!content.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-1 h-3 w-3" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Single Comment Item ─────────────────────────────────────────────────────

function CommentItem({
  comment,
  postId,
  postAuthorId,
  currentUserId,
  currentUserRole,
  depth = 0,
  onCommentUpdated,
}: {
  comment: CommentData | ReplyData;
  postId: string;
  postAuthorId?: string;
  currentUserId?: string;
  currentUserRole?: string;
  depth?: number;
  onCommentUpdated: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);

  const isAuthor = currentUserId === comment.author.id;
  const isPostAuthor = currentUserId === postAuthorId;
  const isAdmin = currentUserRole === "ADMIN";
  const canDelete = isAuthor || isPostAuthor || isAdmin;
  const canEdit = isAuthor && comment.status !== "DELETED" && comment.status !== "HIDDEN";

  const isDeleted = comment.status === "DELETED";
  const isHidden = comment.status === "HIDDEN";
  const isFlagged = comment.status === "FLAGGED";

  const handleReply = async (content: string) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: comment.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to post reply");
    }

    setShowReplyForm(false);
    toast.success("Reply posted");
    onCommentUpdated();
  };

  const handleEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to edit comment");
      }

      setIsEditing(false);
      toast.success("Comment updated");
      onCommentUpdated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to edit comment"
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Comment deleted");
      onCommentUpdated();
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed bg-muted/20 p-3",
          depth > 0 && "ml-10"
        )}
      >
        <p className="text-xs italic text-muted-foreground">
          [comment deleted]
        </p>
      </div>
    );
  }

  return (
    <div className={cn(depth > 0 && "ml-8 border-l-2 pl-4")}>
      <div
        className={cn(
          "group relative rounded-lg border bg-card p-3 transition-colors",
          isHidden && "border-yellow-200 bg-yellow-50/30 dark:border-yellow-900 dark:bg-yellow-950/20",
          isFlagged && "border-orange-200 bg-orange-50/30 dark:border-orange-900 dark:bg-orange-950/20"
        )}
      >
        {/* Status badges */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {isFlagged && (
            <Badge variant="outline" className="border-orange-300 text-[10px] text-orange-600">
              <Flag className="mr-0.5 h-2.5 w-2.5" />
              Flagged
            </Badge>
          )}
          {isHidden && (
            <Badge variant="outline" className="border-yellow-300 text-[10px] text-yellow-600">
              <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
              Hidden
            </Badge>
          )}
        </div>

        {/* Author info */}
        <div className="mb-1.5 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.author.image || ""} />
            <AvatarFallback className="text-[8px]">
              {getInitials(comment.author.name || "A")}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">
              {comment.author.name || "Anonymous"}
            </span>
            {comment.author.role === "ADMIN" && (
              <Badge variant="default" className="h-4 px-1 text-[8px]">
                ADMIN
              </Badge>
            )}
            {comment.author.id === postAuthorId && (
              <Badge variant="secondary" className="h-4 px-1 text-[8px]">
                Author
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-[10px] text-muted-foreground">(edited)</span>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] text-sm"
              rows={2}
            />
            <div className="mt-1 flex items-center gap-1.5">
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleEdit}
                disabled={isSavingEdit || !editContent.trim()}
              >
                {isSavingEdit ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <CommentLikeButton
              commentId={comment.id}
              postId={postId}
              initialLiked={comment.liked}
              initialCount={comment._count.likes}
            />

            {currentUserId && !isDeleted && !isHidden && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                aria-label="Reply to comment"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Delete comment"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                aria-label="Edit comment"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder={`Reply to ${comment.author.name || "Anonymous"}...`}
              submitLabel="Reply"
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {"replies" in comment && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              depth={depth + 1}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Comments Section ───────────────────────────────────────────────────

export function CommentsSection({
  postId,
  postAuthorId,
  initialComments,
  initialCount,
  className,
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = React.useState<CommentData[]>(initialComments);
  const [count, setCount] = React.useState(initialCount);
  const [sort, setSort] = React.useState<"newest" | "oldest" | "popular">("newest");
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const fetchComments = React.useCallback(
    async (pageNum: number, sortBy: string, append = false) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/posts/${postId}/comments?page=${pageNum}&limit=20&sort=${sortBy}`
        );
        if (!res.ok) throw new Error("Failed to fetch comments");

        const data = await res.json();
        if (append) {
          setComments((prev) => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setHasMore(data.hasMore);
        setCount(data.total);
      } catch {
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    },
    [postId]
  );

  const handleSortChange = (newSort: "newest" | "oldest" | "popular") => {
    setSort(newSort);
    setPage(1);
    fetchComments(1, newSort);
  };

  const handleNewComment = async (content: string) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to post comment");
    }

    const comment = await res.json();

    if (comment.message) {
      toast.success(comment.message);
    } else {
      setComments((prev) => [comment, ...prev]);
      setCount((prev) => prev + 1);
      toast.success("Comment posted successfully");
    }
  };

  const handleCommentUpdated = () => {
    setRefreshKey((k) => k + 1);
    fetchComments(page, sort);
  };

  // Refresh when sort changes or refresh key changes
  React.useEffect(() => {
    fetchComments(page, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, refreshKey]);

  return (
    <section className={cn("mt-12", className)} aria-label="Comments">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            Comments{" "}
            {count > 0 && (
              <span className="text-muted-foreground">({count})</span>
            )}
          </h2>
        </div>

        {/* Sort controls */}
        {comments.length > 0 && (
          <div className="flex items-center gap-1">
            {(["newest", "oldest", "popular"] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleSortChange(option)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  sort === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comment Form */}
      {session ? (
        <CommentForm
          postId={postId}
          onSubmit={handleNewComment}
          placeholder="Share your thoughts..."
        />
      ) : (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          <a
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </a>{" "}
          to leave a comment
        </div>
      )}

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border bg-card p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={session?.user?.id}
              currentUserRole={session?.user?.role}
              onCommentUpdated={handleCommentUpdated}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchComments(nextPage, sort, true);
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                )}
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({
  postId,
  initialBookmarked = false,
  className,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleBookmark = async () => {
    if (!session) {
      toast.error("Please sign in to bookmark posts");
      return;
    }

    setIsLoading(true);
    // Optimistic update
    setBookmarked(!bookmarked);

    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: bookmarked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        // Revert on error
        setBookmarked(bookmarked);
        throw new Error("Failed to update bookmark");
      }
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-colors",
        bookmarked
          ? "text-yellow-500"
          : "text-muted-foreground hover:text-yellow-500",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-all",
          bookmarked && "fill-current",
          isLoading && "animate-pulse"
        )}
      />
    </button>
  );
}

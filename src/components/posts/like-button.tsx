"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLiked?: boolean;
  className?: string;
}

export function LikeButton({
  postId,
  initialLikes,
  initialLiked = false,
  className,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = React.useState(initialLiked);
  const [likes, setLikes] = React.useState(initialLikes);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLike = async () => {
    if (!session) {
      toast.error("Please sign in to like posts");
      return;
    }

    setIsLoading(true);
    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        // Revert on error
        setLiked(liked);
        setLikes(likes);
        throw new Error("Failed to update like");
      }
    } catch {
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
        "inline-flex items-center gap-1.5 text-sm transition-colors",
        liked
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-500",
        className
      )}
      aria-label={liked ? "Unlike this post" : "Like this post"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          liked && "fill-current scale-110",
          isLoading && "animate-pulse"
        )}
      />
      <span>{likes}</span>
    </button>
  );
}
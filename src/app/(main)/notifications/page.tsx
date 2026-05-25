"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  BookOpen,
  FileText,
  CheckCheck,
  Trash2,
  Loader2,
  Megaphone,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  image: string | null;
  read: boolean;
  createdAt: Date;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  post: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  const fetchNotifications = React.useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setUnreadCount(data.unreadCount);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      const removed = notifications.find((n) => n.id === notificationId);
      if (removed && !removed.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "NEW_COMMENT":
      case "COMMENT_REPLY":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case "COMMENT_LIKE":
      case "POST_LIKE":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        );
      case "POST_BOOKMARK":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case "POST_PUBLISHED":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        );
      case "NEW_FOLLOWER":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <UserPlus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
        );
      case "SYSTEM":
      case "WEEKLY_DIGEST":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Megaphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="mr-1 h-3 w-3" />
                )}
                Mark all read
              </Button>
            )}
            <Link href="/profile?tab=notifications">
              <Button variant="ghost" size="sm">
                <Settings className="mr-1 h-3 w-3" />
                Preferences
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-1">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold">No notifications yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll notify you when someone interacts with your content or
                when there are important updates.
              </p>
            </div>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-lg px-4 py-4 text-left transition-colors hover:bg-accent",
                  !notification.read && "bg-accent/50"
                )}
              >
                {/* Actor Avatar or Icon */}
                {notification.actor?.image ? (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={notification.actor.image} />
                    <AvatarFallback>
                      {getInitials(notification.actor.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  getNotificationIcon(notification.type)
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm">
                        {notification.actor?.name && (
                          <span className="font-medium">
                            {notification.actor.name}{" "}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {notification.title}
                        </span>
                      </p>
                      {notification.message && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      )}
                      {notification.post && (
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          on &ldquo;{notification.post.title}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/70">
                      {formatDateShort(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </button>
            ))}

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications(page + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more notifications"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

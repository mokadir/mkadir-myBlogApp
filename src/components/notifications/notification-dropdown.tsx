"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=10`);
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
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

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
    onClose();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "NEW_COMMENT":
      case "COMMENT_REPLY":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case "COMMENT_LIKE":
      case "POST_LIKE":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
        );
      case "POST_BOOKMARK":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case "POST_PUBLISHED":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case "NEW_FOLLOWER":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <UserPlus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        );
      case "SYSTEM":
      case "WEEKLY_DIGEST":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Megaphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                  !notification.read && "bg-accent/50"
                )}
              >
                {/* Actor Avatar or Icon */}
                {notification.actor?.image ? (
                  <Avatar className="h-8 w-8 shrink-0">
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
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {formatDateShort(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </button>
            ))}

            {/* Load More */}
            {page < totalPages && (
              <button
                onClick={() => fetchNotifications(page + 1)}
                className="w-full border-t px-4 py-2.5 text-center text-xs text-muted-foreground hover:bg-accent"
              >
                {isLoading ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Load more"
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

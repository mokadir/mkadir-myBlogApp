import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  image?: string;
  recipientId: string;
  actorId?: string;
  postId?: string;
  commentId?: string;
}

export interface NotificationWithActor {
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

export interface NotificationPreferences {
  emailOnComment: boolean;
  emailOnReply: boolean;
  emailOnLike: boolean;
  emailOnDigest: boolean;
  pushOnComment: boolean;
  pushOnReply: boolean;
  pushOnLike: boolean;
  pushOnFollow: boolean;
}

// ─── Create Notification ─────────────────────────────────────────────────────

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  // Check if recipient has this notification type enabled
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: {
      emailOnComment: true,
      emailOnReply: true,
      emailOnLike: true,
      pushOnComment: true,
      pushOnReply: true,
      pushOnLike: true,
      pushOnFollow: true,
    },
  });

  if (!recipient) return;

  // Check push notification preference
  const pushEnabled = checkPushPreference(recipient, input.type);
  if (!pushEnabled) return;

  // Don't notify if actor is the same as recipient
  if (input.actorId === input.recipientId) return;

  // Check for duplicate notifications (e.g., multiple likes on same post)
  if (input.type === "POST_LIKE" || input.type === "COMMENT_LIKE") {
    const existing = await prisma.notification.findFirst({
      where: {
        type: input.type,
        recipientId: input.recipientId,
        actorId: input.actorId,
        postId: input.postId,
        commentId: input.commentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    });
    if (existing) return;
  }

  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      image: input.image,
      recipientId: input.recipientId,
      actorId: input.actorId,
      postId: input.postId,
      commentId: input.commentId,
    },
  });
}

function checkPushPreference(
  prefs: Partial<NotificationPreferences>,
  type: NotificationType
): boolean {
  switch (type) {
    case "NEW_COMMENT":
      return prefs.pushOnComment ?? true;
    case "COMMENT_REPLY":
      return prefs.pushOnReply ?? true;
    case "COMMENT_LIKE":
    case "POST_LIKE":
      return prefs.pushOnLike ?? true;
    case "NEW_FOLLOWER":
      return prefs.pushOnFollow ?? true;
    default:
      return true;
  }
}

// ─── Get Notifications ───────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  notifications: NotificationWithActor[];
  total: number;
  unreadCount: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        actor: {
          select: { id: true, name: true, image: true },
        },
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({
      where: { recipientId: userId, read: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Mark as Read ─────────────────────────────────────────────────────────────

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      read: false,
    },
    data: { read: true },
  });
}

// ─── Delete Notification ─────────────────────────────────────────────────────

export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });
}

// ─── Get Unread Count ────────────────────────────────────────────────────────

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, read: false },
  });
}

// ─── Notification Triggers ───────────────────────────────────────────────────

export async function notifyNewComment(params: {
  commentId: string;
  postId: string;
  commentAuthorId: string;
  postAuthorId: string;
  postTitle: string;
  postSlug: string;
  commentContent: string;
}): Promise<void> {
  const { commentAuthorId, postAuthorId, postTitle, postSlug, commentContent } =
    params;

  // Notify post author
  await createNotification({
    type: "NEW_COMMENT",
    title: "New Comment on Your Post",
    message: `${commentContent.substring(0, 150)}...`,
    link: `/posts/${postSlug}`,
    recipientId: postAuthorId,
    actorId: commentAuthorId,
    postId: params.postId,
    commentId: params.commentId,
  });
}

export async function notifyCommentReply(params: {
  commentId: string;
  postId: string;
  replyAuthorId: string;
  parentCommentAuthorId: string;
  postTitle: string;
  postSlug: string;
  replyContent: string;
}): Promise<void> {
  const {
    replyAuthorId,
    parentCommentAuthorId,
    postTitle,
    postSlug,
    replyContent,
  } = params;

  await createNotification({
    type: "COMMENT_REPLY",
    title: "Reply to Your Comment",
    message: `${replyContent.substring(0, 150)}...`,
    link: `/posts/${postSlug}`,
    recipientId: parentCommentAuthorId,
    actorId: replyAuthorId,
    postId: params.postId,
    commentId: params.commentId,
  });
}

export async function notifyPostLike(params: {
  postId: string;
  likerId: string;
  postAuthorId: string;
  postTitle: string;
  postSlug: string;
}): Promise<void> {
  const { likerId, postAuthorId, postTitle, postSlug } = params;

  await createNotification({
    type: "POST_LIKE",
    title: "Someone Liked Your Post",
    message: `Your post "${postTitle}" received a like`,
    link: `/posts/${postSlug}`,
    recipientId: postAuthorId,
    actorId: likerId,
    postId: params.postId,
  });
}

export async function notifyNewFollower(params: {
  followerId: string;
  followedUserId: string;
  followerName: string;
}): Promise<void> {
  const { followerId, followedUserId, followerName } = params;

  await createNotification({
    type: "NEW_FOLLOWER",
    title: "New Follower",
    message: `${followerName} started following you`,
    link: `/profile`,
    recipientId: followedUserId,
    actorId: followerId,
  });
}

export async function notifyPostPublished(params: {
  postId: string;
  authorId: string;
  postTitle: string;
  postSlug: string;
  followers: { followerId: string }[];
}): Promise<void> {
  const { authorId, postTitle, postSlug, followers } = params;

  // Notify all followers
  for (const follow of followers) {
    await createNotification({
      type: "POST_PUBLISHED",
      title: "New Post Published",
      message: `${postTitle}`,
      link: `/posts/${postSlug}`,
      recipientId: follow.followerId,
      actorId: authorId,
      postId: params.postId,
    });
  }
}

// ─── Update Notification Preferences ─────────────────────────────────────────

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: preferences,
  });
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailOnComment: true,
      emailOnReply: true,
      emailOnLike: true,
      emailOnDigest: true,
      pushOnComment: true,
      pushOnReply: true,
      pushOnLike: true,
      pushOnFollow: true,
    },
  });

  return {
    emailOnComment: user?.emailOnComment ?? true,
    emailOnReply: user?.emailOnReply ?? true,
    emailOnLike: user?.emailOnLike ?? true,
    emailOnDigest: user?.emailOnDigest ?? true,
    pushOnComment: user?.pushOnComment ?? true,
    pushOnReply: user?.pushOnReply ?? true,
    pushOnLike: user?.pushOnLike ?? true,
    pushOnFollow: user?.pushOnFollow ?? true,
  };
}

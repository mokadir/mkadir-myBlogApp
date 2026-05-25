import { prisma } from "@/lib/prisma";
import { sendEmail, weeklyDigestEmail } from "@/lib/notifications/email-service";
import { absoluteUrl } from "@/lib/utils";
import crypto from "crypto";

// ─── Subscribe ───────────────────────────────────────────────────────────────

export async function subscribeToNewsletter(
  email: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  // Check if already subscribed
  const existing = await prisma.newsletterSubscription.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.active) {
      return { success: false, message: "Already subscribed to newsletter" };
    }

    // Reactivate
    await prisma.newsletterSubscription.update({
      where: { id: existing.id },
      data: { active: true },
    });

    return { success: true, message: "Newsletter subscription reactivated" };
  }

  // Create new subscription
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.newsletterSubscription.create({
    data: {
      email,
      userId,
      token,
      active: true,
    },
  });

  return { success: true, message: "Successfully subscribed to newsletter" };
}

// ─── Unsubscribe ─────────────────────────────────────────────────────────────

export async function unsubscribeFromNewsletter(
  token: string
): Promise<{ success: boolean; message: string }> {
  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { token },
  });

  if (!subscription) {
    return { success: false, message: "Invalid unsubscribe token" };
  }

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: { active: false },
  });

  return { success: true, message: "Successfully unsubscribed from newsletter" };
}

export async function unsubscribeByEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { email },
  });

  if (!subscription) {
    return { success: false, message: "Email not found in subscriptions" };
  }

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: { active: false },
  });

  return { success: true, message: "Successfully unsubscribed from newsletter" };
}

// ─── Get Subscriber Count ────────────────────────────────────────────────────

export async function getActiveSubscriberCount(): Promise<number> {
  return prisma.newsletterSubscription.count({
    where: { active: true },
  });
}

// ─── Get All Active Subscribers ──────────────────────────────────────────────

export async function getActiveSubscribers(): Promise<
  Array<{ email: string; token: string; userId: string | null }>
> {
  const subscriptions = await prisma.newsletterSubscription.findMany({
    where: { active: true },
    select: { email: true, token: true, userId: true },
  });

  return subscriptions;
}

// ─── Send Weekly Digest ──────────────────────────────────────────────────────

export async function sendWeeklyDigest(): Promise<{
  sent: number;
  failed: number;
}> {
  const subscribers = await getActiveSubscribers();
  let sent = 0;
  let failed = 0;

  // Get posts from the last week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentPosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: oneWeekAgo },
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  if (recentPosts.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Get top commenter
  const topCommenter = await prisma.comment.groupBy({
    by: ["authorId"],
    where: {
      createdAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  });

  let topCommenterName: string | undefined;
  if (topCommenter.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: topCommenter[0].authorId },
      select: { name: true },
    });
    topCommenterName = user?.name || undefined;
  }

  // Total likes and comments for the week
  const totalLikes = await prisma.like.count({
    where: {
      createdAt: { gte: oneWeekAgo },
    },
  });

  const totalComments = await prisma.comment.count({
    where: {
      createdAt: { gte: oneWeekAgo },
    },
  });

  // Send digest to each subscriber
  for (const subscriber of subscribers) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get user name if available
    let recipientName = "there";
    if (subscriber.userId) {
      const user = await prisma.user.findUnique({
        where: { id: subscriber.userId },
        select: { name: true },
      });
      if (user?.name) recipientName = user.name;
    }

    const html = weeklyDigestEmail({
      recipientName,
      posts: recentPosts.map((post) => ({
        title: post.title,
        excerpt: post.excerpt,
        slug: post.slug,
        authorName: post.author.name,
        readTime: post.readTime,
        publishedAt: post.publishedAt || post.createdAt,
      })),
      topCommenter: topCommenterName,
      totalLikes,
      totalComments,
    });

    const success = await sendEmail({
      to: subscriber.email,
      subject: "Your Weekly Digest - ModernBlog",
      html,
    });

    if (success) {
      sent++;
      // Track sent
      if (subscriber.userId) {
        await prisma.newsletterSent.create({
          data: {
            subject: "Weekly Digest",
            content: html,
            sentCount: 1,
            type: "weekly_digest",
            userId: subscriber.userId,
          },
        });
      }
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

// ─── Send Custom Newsletter ──────────────────────────────────────────────────

export async function sendCustomNewsletter(params: {
  subject: string;
  htmlContent: string;
  userId: string;
}): Promise<{ sent: number; failed: number }> {
  const subscribers = await getActiveSubscribers();
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const success = await sendEmail({
      to: subscriber.email,
      subject: params.subject,
      html: params.htmlContent,
    });

    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  // Track sent
  await prisma.newsletterSent.create({
    data: {
      subject: params.subject,
      content: params.htmlContent,
      sentCount: sent,
      type: "custom",
      userId: params.userId,
    },
  });

  return { sent, failed };
}

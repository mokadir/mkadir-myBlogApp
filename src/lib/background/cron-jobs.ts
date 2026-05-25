// ─── Background Jobs / Cron Jobs ─────────────────────────────────────────────
//
// These functions are designed to be called by a cron job service (e.g., Vercel
// Cron Jobs, GitHub Actions, or a simple setInterval in development).
//
// API endpoints are provided for each job so they can be triggered via HTTP:
//   - POST /api/digest  (weekly digest)
//
// For Vercel Cron Jobs, add to vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/digest",
//       "schedule": "0 9 * * 1"  // Every Monday at 9 AM
//     }
//   ]
// }

import { prisma } from "@/lib/prisma";
import { sendWeeklyDigest } from "@/lib/notifications/newsletter-service";

// ─── Weekly Digest Job ───────────────────────────────────────────────────────
//
// Sends weekly digest emails to all active newsletter subscribers.
// Should be scheduled to run once per week (e.g., Monday morning).

export async function runWeeklyDigestJob(): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  message: string;
}> {
  try {
    const result = await sendWeeklyDigest();
    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: `Weekly digest sent to ${result.sent} subscribers (${result.failed} failed)`,
    };
  } catch (error) {
    console.error("Weekly digest job failed:", error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      message: "Weekly digest job failed",
    };
  }
}

// ─── Cleanup Old Notifications Job ───────────────────────────────────────────
//
// Deletes notifications older than 90 days to keep the database clean.
// Should be scheduled to run once per day.

export async function cleanupOldNotificationsJob(): Promise<{
  deleted: number;
  message: string;
}> {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    return {
      deleted: result.count,
      message: `Cleaned up ${result.count} old notifications`,
    };
  } catch (error) {
    console.error("Cleanup notifications job failed:", error);
    return {
      deleted: 0,
      message: "Cleanup notifications job failed",
    };
  }
}

// ─── Cleanup Expired Tokens Job ──────────────────────────────────────────────
//
// Deletes expired password reset tokens and verification tokens.
// Should be scheduled to run once per day.

export async function cleanupExpiredTokensJob(): Promise<{
  deletedResetTokens: number;
  deletedVerificationTokens: number;
  message: string;
}> {
  try {
    const now = new Date();

    const [resetTokens, verificationTokens] = await Promise.all([
      prisma.passwordResetToken.deleteMany({
        where: { expires: { lt: now } },
      }),
      prisma.verificationToken.deleteMany({
        where: { expires: { lt: now } },
      }),
    ]);

    return {
      deletedResetTokens: resetTokens.count,
      deletedVerificationTokens: verificationTokens.count,
      message: `Cleaned up ${resetTokens.count} reset tokens and ${verificationTokens.count} verification tokens`,
    };
  } catch (error) {
    console.error("Cleanup tokens job failed:", error);
    return {
      deletedResetTokens: 0,
      deletedVerificationTokens: 0,
      message: "Cleanup tokens job failed",
    };
  }
}

// ─── Run All Cleanup Jobs ────────────────────────────────────────────────────
//
// Runs all maintenance jobs. Should be scheduled to run once per day.

export async function runDailyMaintenance(): Promise<{
  notifications: { deleted: number };
  tokens: { deletedResetTokens: number; deletedVerificationTokens: number };
  message: string;
}> {
  const [notifications, tokens] = await Promise.all([
    cleanupOldNotificationsJob(),
    cleanupExpiredTokensJob(),
  ]);

  return {
    notifications: { deleted: notifications.deleted },
    tokens: {
      deletedResetTokens: tokens.deletedResetTokens,
      deletedVerificationTokens: tokens.deletedVerificationTokens,
    },
    message: `Daily maintenance complete: cleaned ${notifications.deleted} notifications and ${tokens.deletedResetTokens + tokens.deletedVerificationTokens} expired tokens`,
  };
}

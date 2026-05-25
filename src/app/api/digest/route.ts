import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWeeklyDigest } from "@/lib/notifications/newsletter-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify cron secret for automated triggers
    const body = await request.json().catch(() => ({}));
    const cronSecret = body.secret;

    if (
      process.env.CRON_SECRET &&
      cronSecret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const result = await sendWeeklyDigest();

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Send digest error:", error);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}

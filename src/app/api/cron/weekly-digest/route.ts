import { NextRequest, NextResponse } from "next/server";
import { runWeeklyDigestJob } from "@/lib/background/cron-jobs";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get("authorization");

    const cronSecret =
      body.secret ||
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (
      process.env.CRON_SECRET &&
      cronSecret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runWeeklyDigestJob();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron weekly digest error:", error);
    return NextResponse.json(
      { error: "Failed to run weekly digest" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runDailyMaintenance } from "@/lib/background/cron-jobs";

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

    const result = await runDailyMaintenance();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron daily maintenance error:", error);
    return NextResponse.json(
      { error: "Failed to run daily maintenance" },
      { status: 500 }
    );
  }
}

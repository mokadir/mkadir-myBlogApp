import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  unsubscribeByEmail,
  getActiveSubscriberCount,
} from "@/lib/notifications/newsletter-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action, token } = body;

    if (action === "unsubscribe") {
      if (token) {
        const result = await unsubscribeFromNewsletter(token);
        return NextResponse.json(result);
      }
      if (email) {
        const result = await unsubscribeByEmail(email);
        return NextResponse.json(result);
      }
      return NextResponse.json(
        { error: "Email or token required for unsubscribe" },
        { status: 400 }
      );
    }

    // Subscribe
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const result = await subscribeToNewsletter(email, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Failed to process newsletter request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await getActiveSubscriberCount();
    return NextResponse.json({ subscriberCount: count });
  } catch (error) {
    console.error("Get subscriber count error:", error);
    return NextResponse.json(
      { error: "Failed to get subscriber count" },
      { status: 500 }
    );
  }
}

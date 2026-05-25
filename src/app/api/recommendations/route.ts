import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getRecommendedPosts,
  getPersonalizedFeed,
} from "@/lib/search/search-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "recommended"; // recommended | feed
    const currentPostId = searchParams.get("currentPostId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (type === "feed" && userId) {
      // Personalized feed for logged-in users
      const feed = await getPersonalizedFeed(userId, page, limit);
      return NextResponse.json(feed);
    }

    // General recommendations
    const recommendations = await getRecommendedPosts(
      userId,
      currentPostId,
      limit
    );

    return NextResponse.json({ posts: recommendations });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}

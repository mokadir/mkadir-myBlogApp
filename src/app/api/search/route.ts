import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  searchPosts,
  getSearchSuggestions,
  recordSearch,
  getTrendingSearches,
} from "@/lib/search/search-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "results"; // results | suggestions | trending
    const categoryId = searchParams.get("categoryId") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const sortBy = searchParams.get("sortBy") as
      | "relevance"
      | "newest"
      | "oldest"
      | "popular"
      | undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Handle different search types
    if (type === "suggestions") {
      const suggestions = await getSearchSuggestions(query);
      return NextResponse.json({ suggestions });
    }

    if (type === "trending") {
      const trending = getTrendingSearches(10);
      return NextResponse.json({ trending });
    }

    // Full search results
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Record the search for trending
    recordSearch(query);

    const session = await getServerSession(authOptions);

    const results = await searchPosts({
      query,
      filters: {
        categoryId,
        tag,
        authorId,
        sortBy,
      },
      page,
      limit,
    });

    return NextResponse.json({
      ...results,
      userId: session?.user?.id,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  readTime: number | null;
  createdAt: Date;
  publishedAt: Date | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  _count: {
    comments: number;
    likes: number;
  };
  relevanceScore: number;
}

export interface SearchSuggestion {
  text: string;
  type: "title" | "tag" | "category" | "author";
  count: number;
}

export interface SearchFilters {
  categoryId?: string;
  tag?: string;
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "relevance" | "newest" | "oldest" | "popular";
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

// ─── Trending Searches ───────────────────────────────────────────────────────

const TRENDING_SEARCHES_KEY = "trending_searches";
const TRENDING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory store for trending searches (in production, use Redis)
const trendingStore: Map<string, { count: number; lastSearched: number }> =
  new Map();

export function recordSearch(query: string): void {
  const normalized = query.toLowerCase().trim();
  if (!normalized || normalized.length < 2) return;

  const existing = trendingStore.get(normalized);
  if (existing) {
    existing.count += 1;
    existing.lastSearched = Date.now();
  } else {
    trendingStore.set(normalized, { count: 1, lastSearched: Date.now() });
  }

  // Clean old entries
  const cutoff = Date.now() - TRENDING_WINDOW_MS;
  for (const [key, val] of trendingStore) {
    if (val.lastSearched < cutoff) {
      trendingStore.delete(key);
    }
  }
}

export function getTrendingSearches(limit = 5): string[] {
  return Array.from(trendingStore.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([query]) => query);
}

// ─── Full-Text Search ────────────────────────────────────────────────────────

function buildSearchWhere(
  query: string,
  filters?: SearchFilters
): Prisma.PostWhereInput {
  const searchTerms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
  };

  if (searchTerms.length > 0) {
    where.OR = searchTerms.map((term) => ({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
        { subtitle: { contains: term, mode: "insensitive" } },
        { tags: { has: term } },
        {
          author: {
            name: { contains: term, mode: "insensitive" },
          },
        },
        {
          category: {
            name: { contains: term, mode: "insensitive" },
          },
        },
      ],
    }));
  }

  // Apply filters
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.tag) {
    where.tags = { has: filters.tag };
  }

  if (filters?.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.publishedAt = {};
    if (filters.dateFrom) {
      where.publishedAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.publishedAt.lte = filters.dateTo;
    }
  }

  return where;
}

function buildSearchOrderBy(
  sortBy?: "relevance" | "newest" | "oldest" | "popular"
): Prisma.PostOrderByWithRelationInput[] {
  switch (sortBy) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "oldest":
      return [{ publishedAt: "asc" }, { createdAt: "asc" }];
    case "popular":
      return [{ likes: { _count: "desc" } }, { publishedAt: "desc" }];
    case "relevance":
    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function searchPosts(
  options: SearchOptions
): Promise<{ results: SearchResult[]; total: number; totalPages: number }> {
  const { query, filters, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const where = buildSearchWhere(query, filters);
  const orderBy = buildSearchOrderBy(filters?.sortBy);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  // Calculate relevance scores
  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const results: SearchResult[] = posts.map((post) => {
    let score = 0;
    const titleLower = post.title.toLowerCase();
    const excerptLower = (post.excerpt || "").toLowerCase();
    const contentPreview = post.content.substring(0, 500).toLowerCase();

    for (const term of searchTerms) {
      // Title matches are weighted highest
      if (titleLower.includes(term)) {
        score += 10;
        // Exact title match bonus
        if (titleLower === term) score += 5;
      }
      // Excerpt matches
      if (excerptLower.includes(term)) score += 3;
      // Content matches
      if (contentPreview.includes(term)) score += 1;
      // Tag matches
      if (post.tags.some((t) => t.toLowerCase().includes(term))) score += 4;
      // Category matches
      if (
        post.category?.name.toLowerCase().includes(term)
      ) {
        score += 3;
      }
    }

    // Popularity boost
    score += Math.log(post._count.likes + 1) * 0.5;
    // Recency boost (posts published within last 7 days)
    if (post.publishedAt) {
      const daysSincePublished =
        (Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 7) score += 2;
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      tags: post.tags,
      readTime: post.readTime,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      author: post.author,
      category: post.category,
      _count: post._count,
      relevanceScore: score,
    };
  });

  // Sort by relevance score for relevance sort
  if (!filters?.sortBy || filters.sortBy === "relevance") {
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    results,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Search Suggestions ──────────────────────────────────────────────────────

export async function getSearchSuggestions(
  query: string
): Promise<SearchSuggestion[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized || normalized.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];

  // Title suggestions
  const titleMatches = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      title: { contains: normalized, mode: "insensitive" },
    },
    select: { title: true },
    take: 5,
    orderBy: { publishedAt: "desc" },
  });

  for (const match of titleMatches) {
    suggestions.push({
      text: match.title,
      type: "title",
      count: 1,
    });
  }

  // Tag suggestions
  const tagMatches = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      tags: { has: normalized },
    },
    select: { tags: true },
    take: 50,
  });

  const tagCounts = new Map<string, number>();
  for (const post of tagMatches) {
    for (const tag of post.tags) {
      if (tag.toLowerCase().includes(normalized)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  for (const [tag, count] of tagCounts) {
    suggestions.push({ text: tag, type: "tag", count });
  }

  // Category suggestions
  const categoryMatches = await prisma.category.findMany({
    where: {
      name: { contains: normalized, mode: "insensitive" },
    },
    include: { _count: { select: { posts: true } } },
    take: 3,
  });

  for (const cat of categoryMatches) {
    suggestions.push({
      text: cat.name,
      type: "category",
      count: cat._count.posts,
    });
  }

  // Author suggestions
  const authorMatches = await prisma.user.findMany({
    where: {
      name: { contains: normalized, mode: "insensitive" },
      posts: { some: { status: "PUBLISHED" } },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
    take: 3,
  });

  for (const author of authorMatches) {
    if (author.name) {
      suggestions.push({
        text: author.name,
        type: "author",
        count: author._count.posts,
      });
    }
  }

  // Sort by count (popularity) and limit
  return suggestions
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

// ─── Recommendation Engine ───────────────────────────────────────────────────

export interface Recommendation {
  postId: string;
  score: number;
  reason: string;
}

export async function getRecommendedPosts(
  userId?: string,
  currentPostId?: string,
  limit = 6
): Promise<SearchResult[]> {
  let recommendedPostIds: string[] = [];

  if (userId) {
    // Personalized recommendations based on user's history
    recommendedPostIds = await getPersonalizedRecommendations(
      userId,
      currentPostId,
      limit
    );
  }

  // Fall back to general recommendations
  if (recommendedPostIds.length === 0) {
    return getGeneralRecommendations(currentPostId, limit);
  }

  // Fetch the recommended posts
  const posts = await prisma.post.findMany({
    where: {
      id: { in: recommendedPostIds },
      status: "PUBLISHED",
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true, color: true },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    tags: post.tags,
    readTime: post.readTime,
    createdAt: post.createdAt,
    publishedAt: post.publishedAt,
    author: post.author,
    category: post.category,
    _count: post._count,
    relevanceScore: 0,
  }));
}

async function getPersonalizedRecommendations(
  userId: string,
  currentPostId?: string,
  limit = 6
): Promise<string[]> {
  // Get user's liked posts, bookmarks, and comments to understand preferences
  const [userLikes, userBookmarks, userComments] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          select: { tags: true, categoryId: true, authorId: true },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          select: { tags: true, categoryId: true, authorId: true },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        post: {
          select: { tags: true, categoryId: true, authorId: true },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Build preference profile
  const tagScores = new Map<string, number>();
  const categoryScores = new Map<string, number>();
  const authorScores = new Map<string, number>();

  const interactions = [
    ...userLikes.map((l) => ({ ...l.post, weight: 3 })),
    ...userBookmarks.map((b) => ({ ...b.post, weight: 2 })),
    ...userComments.map((c) => ({ ...c.post, weight: 1 })),
  ];

  for (const interaction of interactions) {
    for (const tag of interaction.tags) {
      tagScores.set(tag, (tagScores.get(tag) || 0) + interaction.weight);
    }
    if (interaction.categoryId) {
      categoryScores.set(
        interaction.categoryId,
        (categoryScores.get(interaction.categoryId) || 0) + interaction.weight
      );
    }
    authorScores.set(
      interaction.authorId,
      (authorScores.get(interaction.authorId) || 0) + interaction.weight
    );
  }

  // Find posts matching user's preferences
  const topTags = Array.from(tagScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const topCategory = Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([catId]) => catId);

  const topAuthors = Array.from(authorScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([authorId]) => authorId);

  // Exclude posts the user has already interacted with
  const interactedPostIds = new Set([
    ...userLikes.map((l) => l.postId),
    ...userBookmarks.map((b) => b.postId),
    ...userComments.map((c) => c.postId),
  ]);

  if (currentPostId) {
    interactedPostIds.add(currentPostId);
  }

  // Score all available posts
  const candidatePosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: Array.from(interactedPostIds) },
      OR: [
        ...(topTags.length > 0
          ? [{ tags: { hasSome: topTags } }]
          : []),
        ...(topCategory.length > 0
          ? [{ categoryId: { in: topCategory } }]
          : []),
        ...(topAuthors.length > 0
          ? [{ authorId: { in: topAuthors } }]
          : []),
      ],
    },
    select: {
      id: true,
      tags: true,
      categoryId: true,
      authorId: true,
      _count: { select: { likes: true } },
    },
    take: 50,
  });

  const scored = candidatePosts.map((post) => {
    let score = 0;
    const reasons: string[] = [];

    for (const tag of post.tags) {
      const tagScore = tagScores.get(tag) || 0;
      if (tagScore > 0) {
        score += tagScore * 2;
        reasons.push("similar tags");
      }
    }

    if (post.categoryId && categoryScores.has(post.categoryId)) {
      score += (categoryScores.get(post.categoryId) || 0) * 3;
      reasons.push("same category");
    }

    if (authorScores.has(post.authorId)) {
      score += (authorScores.get(post.authorId) || 0) * 2;
      reasons.push("same author");
    }

    // Popularity bonus
    score += Math.log(post._count.likes + 1) * 5;

    return { postId: post.id, score, reason: reasons[0] || "popular" };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.postId);
}

async function getGeneralRecommendations(
  currentPostId?: string,
  limit = 6
): Promise<SearchResult[]> {
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
  };

  if (currentPostId) {
    where.id = { not: currentPostId };
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true, color: true },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { comments: { _count: "desc" } },
      { publishedAt: "desc" },
    ],
    take: limit,
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    tags: post.tags,
    readTime: post.readTime,
    createdAt: post.createdAt,
    publishedAt: post.publishedAt,
    author: post.author,
    category: post.category,
    _count: post._count,
    relevanceScore: 0,
  }));
}

// ─── Personalized Feed ───────────────────────────────────────────────────────

export async function getPersonalizedFeed(
  userId: string,
  page = 1,
  limit = 10
): Promise<{ posts: SearchResult[]; total: number }> {
  const skip = (page - 1) * limit;

  // Get user's followed categories/tags/authors from their interactions
  const [userLikes, userBookmarks] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          select: { tags: true, categoryId: true, authorId: true },
        },
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          select: { tags: true, categoryId: true, authorId: true },
        },
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const preferredTags = new Set<string>();
  const preferredCategories = new Set<string>();
  const preferredAuthors = new Set<string>();

  for (const item of [...userLikes, ...userBookmarks]) {
    for (const tag of item.post.tags) {
      preferredTags.add(tag);
    }
    if (item.post.categoryId) preferredCategories.add(item.post.categoryId);
    preferredAuthors.add(item.post.authorId);
  }

  // Build feed query
  const interactedPostIds = new Set([
    ...userLikes.map((l) => l.postId),
    ...userBookmarks.map((b) => b.postId),
  ]);

  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    id: { notIn: Array.from(interactedPostIds) },
    OR: [
      ...(preferredTags.size > 0
        ? [{ tags: { hasSome: Array.from(preferredTags).slice(0, 10) } }]
        : []),
      ...(preferredCategories.size > 0
        ? [{ categoryId: { in: Array.from(preferredCategories) } }]
        : []),
      ...(preferredAuthors.size > 0
        ? [{ authorId: { in: Array.from(preferredAuthors) } }]
        : []),
    ],
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { likes: { _count: "desc" } }],
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      tags: post.tags,
      readTime: post.readTime,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      author: post.author,
      category: post.category,
      _count: post._count,
      relevanceScore: 0,
    })),
    total,
  };
}

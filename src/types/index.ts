import type { User, Post, Comment, Like, Bookmark, Category, PostStatus } from "@prisma/client";

export type SafeUser = Omit<User, "password">;

export type PostWithAuthor = Post & {
  author: Pick<SafeUser, "id" | "name" | "image">;
  category?: Category | null;
  _count?: {
    comments: number;
    likes: number;
  };
};

export type PostWithDetails = PostWithAuthor & {
  comments: CommentWithAuthor[];
  likes: Like[];
  bookmarks: Bookmark[];
};

export type CommentWithAuthor = Comment & {
  author: Pick<SafeUser, "id" | "name" | "image">;
};

export type PaginatedPosts = {
  posts: PostWithAuthor[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export type EditorContent = {
  type: string;
  content?: EditorContent[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
};

export type PostFormData = {
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  categoryId?: string;
  status: PostStatus;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type SearchParams = {
  q?: string;
  tag?: string;
  category?: string;
  status?: string;
  page?: string;
  limit?: string;
  sort?: string;
};

export type ThemeMode = "light" | "dark" | "system";

export type ToastType = "success" | "error" | "info" | "warning";

export type SortOption = "newest" | "oldest" | "popular" | "trending";

export type DashboardFilters = {
  search: string;
  status: string;
  category: string;
  sort: string;
};

export type PostStats = {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
};

export type CategoryWithCount = Category & {
  _count: {
    posts: number;
  };
};
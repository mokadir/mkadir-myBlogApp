"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/admin/stats-card";
import { AreaChart } from "@/components/admin/charts/area-chart";
import { PieChart } from "@/components/admin/charts/pie-chart";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  MessageSquare,
  Eye,
  Heart,
  Bookmark,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalCategories: number;
    publishedPosts: number;
    draftPosts: number;
    totalLikes: number;
    totalBookmarks: number;
    bannedUsers: number;
  };
  charts: {
    postsByStatus: Array<{ name: string; value: number; color: string }>;
    usersByRole: Array<{ name: string; value: number; color: string }>;
    commentsByStatus: Array<{ name: string; value: number; color: string }>;
    postsOverTime: Array<{ name: string; value: number }>;
  };
  popularPosts: Array<{
    id: string;
    title: string;
    slug: string;
    likes: number;
    comments: number;
    bookmarks: number;
    authorName: string | null;
    authorImage: string | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    isBanned: boolean;
    createdAt: string;
    _count: { posts: number; comments: number };
  }>;
  recentComments: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    author: { name: string | null; image: string | null };
    post: { title: string; slug: string };
  }>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  const { overview, charts, popularPosts, recentUsers, recentComments } = data;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={overview.totalUsers}
          icon={Users}
          description="Registered users"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatsCard
          title="Total Posts"
          value={overview.totalPosts}
          icon={FileText}
          description={`${overview.publishedPosts} published`}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/20"
        />
        <StatsCard
          title="Total Comments"
          value={overview.totalComments}
          icon={MessageSquare}
          description="Across all posts"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
        />
        <StatsCard
          title="Total Likes"
          value={overview.totalLikes}
          icon={Heart}
          description="Post likes"
          iconColor="text-rose-600"
          iconBgColor="bg-rose-100 dark:bg-rose-900/20"
        />
        <StatsCard
          title="Draft Posts"
          value={overview.draftPosts}
          icon={FileText}
          description="Awaiting publication"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100 dark:bg-amber-900/20"
        />
        <StatsCard
          title="Bookmarks"
          value={overview.totalBookmarks}
          icon={Bookmark}
          description="Saved by users"
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100 dark:bg-indigo-900/20"
        />
        <StatsCard
          title="Banned Users"
          value={overview.bannedUsers}
          icon={AlertTriangle}
          description="Suspended accounts"
          iconColor="text-red-600"
          iconBgColor="bg-red-100 dark:bg-red-900/20"
        />
        <StatsCard
          title="Categories"
          value={overview.totalCategories}
          icon={TrendingUp}
          description="Content categories"
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100 dark:bg-cyan-900/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AreaChart
          data={charts.postsOverTime}
          title="Posts Over Time (Last 12 Months)"
          height={300}
        />
        <PieChart
          data={charts.postsByStatus}
          title="Posts by Status"
          size={220}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PieChart
          data={charts.usersByRole}
          title="Users by Role"
          size={220}
        />
        <PieChart
          data={charts.commentsByStatus}
          title="Comments by Status"
          size={220}
        />
      </div>

      {/* Popular Posts */}
      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Most Popular Posts</h3>
        </div>
        <div className="divide-y">
          {popularPosts.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No published posts yet.
            </div>
          ) : (
            popularPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-4 px-6 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {post.authorName || "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> {post.bookmarks}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-lg border">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold">Recent Users</h3>
          </div>
          <div className="divide-y">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No users yet.
              </div>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {user.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.name || "Anonymous"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {user.role}
                    </span>
                    {user.isBanned && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20">
                        Banned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="rounded-lg border">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold">Recent Comments</h3>
          </div>
          <div className="divide-y">
            {recentComments.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No comments yet.
              </div>
            ) : (
              recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="px-6 py-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      on {comment.post.title}
                    </span>
                    {comment.status !== "ACTIVE" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/20">
                        {comment.status}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

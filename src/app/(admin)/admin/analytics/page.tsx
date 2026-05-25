"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/admin/stats-card";
import { AreaChart } from "@/components/admin/charts/area-chart";
import { PieChart } from "@/components/admin/charts/pie-chart";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  Bookmark,
  TrendingUp,
  Calendar,
  Activity,
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
  }>;
}

export default function AnalyticsPage() {
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
          {Array.from({ length: 4 }).map((_, i) => (
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

  const { overview, charts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Detailed analytics and insights about your blog.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={overview.totalUsers}
          icon={Users}
          description="All registered users"
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
          title="Engagement"
          value={overview.totalLikes + overview.totalBookmarks}
          icon={Activity}
          description="Likes + Bookmarks"
          iconColor="text-rose-600"
          iconBgColor="bg-rose-100 dark:bg-rose-900/20"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AreaChart
          data={charts.postsOverTime}
          title="Posts Created Over Time"
          height={350}
        />
        <BarChart
          data={[
            { name: "Published", value: overview.publishedPosts, color: "#22c55e" },
            { name: "Drafts", value: overview.draftPosts, color: "#eab308" },
            {
              name: "Archived",
              value: overview.totalPosts - overview.publishedPosts - overview.draftPosts,
              color: "#6b7280",
            },
          ]}
          title="Posts by Status"
          height={350}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PieChart
          data={charts.usersByRole}
          title="Users by Role"
          size={200}
        />
        <PieChart
          data={charts.commentsByStatus}
          title="Comments by Status"
          size={200}
        />
        <PieChart
          data={charts.postsByStatus}
          title="Posts by Status"
          size={200}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.draftPosts}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalPosts > 0
                ? `${Math.round((overview.draftPosts / overview.totalPosts) * 100)}% of total`
                : "No posts yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              {overview.publishedPosts > 0
                ? `${(overview.totalLikes / overview.publishedPosts).toFixed(1)} avg per post`
                : "No published posts"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalBookmarks}</div>
            <p className="text-xs text-muted-foreground">
              Saved by users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Banned Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.bannedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalUsers > 0
                ? `${((overview.bannedUsers / overview.totalUsers) * 100).toFixed(1)}% of users`
                : "No users"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

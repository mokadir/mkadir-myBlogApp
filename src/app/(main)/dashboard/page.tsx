import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, canWrite } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, FileText, FileCheck, FileArchive, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DashboardPosts } from "@/components/posts/dashboard-posts";
import { DashboardFilters } from "@/components/posts/dashboard-filters";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your blog posts",
};

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const page = Number(params.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { authorId: session.user.id };

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.category && params.category !== "all") {
    where.category = { slug: params.category };
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { excerpt: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  const orderBy: any =
    params.sort === "oldest"
      ? { createdAt: "asc" }
      : params.sort === "updated"
      ? { updatedAt: "desc" }
      : params.sort === "title"
      ? { title: "asc" }
      : { createdAt: "desc" };

  const [rawPosts, total, stats, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
    prisma.post.groupBy({
      by: ["status"],
      where: { authorId: session.user.id },
      _count: true,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Map posts to match DashboardPost type (convert null to undefined for category color)
  const posts = rawPosts.map((post) => ({
    ...post,
    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
          color: post.category.color || undefined,
        }
      : null,
  }));

  const totalPages = Math.ceil(total / limit);

  // Calculate stats
  const publishedCount =
    stats.find((s) => s.status === "PUBLISHED")?._count || 0;
  const draftCount = stats.find((s) => s.status === "DRAFT")?._count || 0;
  const archivedCount =
    stats.find((s) => s.status === "ARCHIVED")?._count || 0;
  const totalPosts =
    publishedCount + draftCount + archivedCount;

  return (
    <div className="container py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your blog posts and content
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">Total Posts</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <FileArchive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{archivedCount}</p>
              <p className="text-xs text-muted-foreground">Archived</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <DashboardFilters categories={categories} />
      </div>

      {/* Posts Table */}
      <DashboardPosts
        posts={posts}
        totalPages={totalPages}
        currentPage={page}
      />
    </div>
  );
}

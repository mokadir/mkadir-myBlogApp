import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total counts
    const [totalUsers, totalPosts, totalComments, totalCategories] =
      await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.comment.count(),
        prisma.category.count(),
      ]);

    // Get published posts count
    const publishedPosts = await prisma.post.count({
      where: { status: "PUBLISHED" },
    });

    // Get draft posts count
    const draftPosts = await prisma.post.count({
      where: { status: "DRAFT" },
    });

    // Get total likes
    const totalLikes = await prisma.like.count();

    // Get total bookmarks
    const totalBookmarks = await prisma.bookmark.count();

    // Get users by role
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    const writers = await prisma.user.count({ where: { role: "WRITER" } });
    const readers = await prisma.user.count({ where: { role: "READER" } });

    // Get comment status counts
    const activeComments = await prisma.comment.count({
      where: { status: "ACTIVE" },
    });
    const flaggedComments = await prisma.comment.count({
      where: { status: "FLAGGED" },
    });
    const hiddenComments = await prisma.comment.count({
      where: { status: "HIDDEN" },
    });

    // Get banned users count
    const bannedUsers = await prisma.user.count({
      where: { isBanned: true },
    });

    // Get posts by status for pie chart
    const postsByStatus = [
      { name: "Published", value: publishedPosts, color: "#22c55e" },
      { name: "Drafts", value: draftPosts, color: "#eab308" },
      {
        name: "Archived",
        value: await prisma.post.count({ where: { status: "ARCHIVED" } }),
        color: "#6b7280",
      },
    ];

    // Get users by role for pie chart
    const usersByRole = [
      { name: "Admins", value: admins, color: "#ef4444" },
      { name: "Writers", value: writers, color: "#3b82f6" },
      { name: "Readers", value: readers, color: "#22c55e" },
    ];

    // Get comment status for pie chart
    const commentsByStatus = [
      { name: "Active", value: activeComments, color: "#22c55e" },
      { name: "Flagged", value: flaggedComments, color: "#eab308" },
      { name: "Hidden", value: hiddenComments, color: "#ef4444" },
    ];

    // Get monthly post creation data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyPosts = await prisma.post.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate posts by month
    const monthlyData: Record<string, number> = {};
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Initialize all months
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyData[key] = 0;
    }

    monthlyPosts.forEach((post) => {
      const key = `${monthNames[post.createdAt.getMonth()]} ${post.createdAt.getFullYear()}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });

    const postsOverTime = Object.entries(monthlyData).map(([name, value]) => ({
      name,
      value,
    }));

    // Get most popular posts (by likes)
    const popularPosts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        likes: { _count: "desc" },
      },
      take: 10,
    });

    const mostPopularPosts = popularPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      likes: post._count.likes,
      comments: post._count.comments,
      bookmarks: post._count.bookmarks,
      authorName: post.author.name,
      authorImage: post.author.image,
    }));

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent comments
    const recentComments = await prisma.comment.findMany({
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        author: {
          select: { name: true, image: true },
        },
        post: {
          select: { title: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPosts,
        totalComments,
        totalCategories,
        publishedPosts,
        draftPosts,
        totalLikes,
        totalBookmarks,
        bannedUsers,
      },
      charts: {
        postsByStatus,
        usersByRole,
        commentsByStatus,
        postsOverTime,
      },
      popularPosts: mostPopularPosts,
      recentUsers,
      recentComments,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

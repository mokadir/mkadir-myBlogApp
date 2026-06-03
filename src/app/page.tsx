import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { TrendingPosts } from "@/components/home/trending-posts";
import { CategoriesSection } from "@/components/home/categories-section";
import { LatestPosts, LatestPostsSkeleton } from "@/components/home/latest-posts";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { FeaturedPosts } from "@/components/posts/featured-posts";
import type { PostWithAuthor } from "@/types";

export const dynamic = "force-dynamic";

async function HomeContent() {
  // Fetch data with error handling for build time
  let featuredPosts: any[] = [];
  let recentPosts: any[] = [];
  let categories: { name: string; slug: string; count: number; color: string }[] = [];

  try {
    const [featured, recent, cats] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED", featured: true },
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.category.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    featuredPosts = featured;
    recentPosts = recent;
    categories = cats.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      count: cat._count.posts,
      color: cat.color || "#6366f1",
    }));
  } catch (error) {
    console.warn("Failed to fetch homepage data:", error);
  }

  return (
    <>
      <HeroSection />

      <FeaturesSection />

      {/* Featured */}
      {featuredPosts.length > 0 && (
        <section className="border-t py-20">
          <div className="container">
            <h2 className="mb-8 text-3xl font-bold">Featured Posts</h2>
            <FeaturedPosts />
          </div>
        </section>
      )}

      {/* Trending */}
      <TrendingPosts posts={recentPosts as PostWithAuthor[]} />

      {/* Categories */}
      <CategoriesSection categories={categories} />

      {/* Latest */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPosts posts={recentPosts as PostWithAuthor[]} />
      </Suspense>

      {/* Newsletter */}
      <NewsletterSection />
    </>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
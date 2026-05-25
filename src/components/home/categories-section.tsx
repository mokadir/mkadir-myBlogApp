"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Code, Palette, Cpu, Globe, Camera } from "lucide-react";
import { useAnimateOnView } from "@/lib/hooks/use-animate-on-view";

const defaultCategories = [
  { name: "Technology", slug: "technology", icon: Code, count: 128, color: "#6366f1" },
  { name: "Design", slug: "design", icon: Palette, count: 85, color: "#ec4899" },
  { name: "Programming", slug: "programming", icon: Cpu, count: 210, color: "#14b8a6" },
  { name: "Tutorials", slug: "tutorials", icon: BookOpen, count: 156, color: "#f59e0b" },
  { name: "Web Dev", slug: "web-dev", icon: Globe, count: 192, color: "#3b82f6" },
  { name: "Photography", slug: "photography", icon: Camera, count: 67, color: "#8b5cf6" },
];

interface Category {
  name: string;
  slug: string;
  icon?: React.ElementType;
  count?: number;
  color?: string;
}

interface CategoriesSectionProps {
  categories?: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const [ref, isVisible] = useAnimateOnView();
  const displayCategories = categories || defaultCategories;

  return (
    <section ref={ref} className="border-t py-20">
      <div className="container">
        <motion.div
          className="mb-12 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl font-bold">Explore by Category</h2>
            <p className="mt-2 text-muted-foreground">
              Browse articles by topic and find what interests you
            </p>
          </div>
          <Link href="/posts">
            <button className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
              All Categories <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {displayCategories.map((category, index) => {
            const Icon = category.icon || BookOpen;
            return (
              <Link key={category.slug} href={`/posts?category=${category.slug}`}>
                <motion.div
                  className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  style={{
                    borderColor: category.color ? `${category.color}20` : undefined,
                  }}
                >
                  {/* Hover gradient */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10"
                    style={{
                      background: `linear-gradient(135deg, ${category.color || "#6366f1"} 0%, transparent 100%)`,
                    }}
                  />

                  <div className="relative">
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${category.color || "#6366f1"}15`, color: category.color || "#6366f1" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.count || 0} articles
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Mobile view all link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
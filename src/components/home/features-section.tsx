"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  PenSquare,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Palette,
  Search,
} from "lucide-react";
import { useAnimateOnView } from "@/lib/hooks/use-animate-on-view";

const features = [
  {
    icon: PenSquare,
    title: "Rich Editor",
    description:
      "Powerful TipTap editor with markdown support, image embedding, and real-time preview.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Beautiful Design",
    description:
      "Clean, modern design with dark mode support, smooth animations, and responsive layouts.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "SEO Optimized",
    description:
      "Built-in SEO features, meta tags, OpenGraph, and sitemaps to help your content rank.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Engage with readers through comments, likes, bookmarks, and follow features.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Secure Auth",
    description:
      "Enterprise-grade authentication with Google OAuth, password hashing, and role-based access.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built on Next.js 15 with React Server Components for instant page loads and optimal performance.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Palette,
    title: "Customizable",
    description:
      "Dark/light mode, customizable themes, and flexible layouts to match your brand.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description:
      "Powerful search across all posts with filtering by tags, categories, and date ranges.",
    gradient: "from-teal-500 to-cyan-500",
  },
];

export function FeaturesSection() {
  const [ref, isVisible] = useAnimateOnView();

  return (
    <section ref={ref} className="border-t py-20">
      <div className="container">
        <motion.div
          className="mx-auto mb-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need to Create
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to make your writing experience seamless
            and enjoyable. From creation to publication, we{"'"}ve got you covered.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                {/* Hover gradient bar */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />

                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
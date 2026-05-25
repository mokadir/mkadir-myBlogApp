"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PenSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/home/search-bar";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const floatingIcons = [
  { Icon: PenSquare, x: "15%", y: "20%", delay: 0, size: 24 },
  { Icon: Sparkles, x: "80%", y: "30%", delay: 0.5, size: 20 },
  { Icon: PenSquare, x: "70%", y: "70%", delay: 1, size: 16 },
  { Icon: Sparkles, x: "25%", y: "75%", delay: 1.5, size: 22 },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:via-transparent dark:to-purple-500/10" />
      
      {/* Animated gradient orbs */}
      <div className="absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      
      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
        <div
          key={i}
          className="absolute hidden animate-float text-primary/20 dark:text-primary/10 md:block"
          style={{ left: x, top: y, animationDelay: `${delay}s` }}
        >
          <Icon size={size} />
        </div>
      ))}

      <div className="container relative">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              New — ModernBlog v2.0 is here
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl"
          >
            Share Your Ideas{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              with the World
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            A modern blogging platform built for writers, creators, and thinkers.
            Write, share, and connect with readers worldwide through beautiful
            stories.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="group relative w-full sm:w-auto">
                <span className="relative z-10 flex items-center">
                  Start Writing Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
            <Link href="/posts">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <PenSquare className="mr-2 h-4 w-4" />
                Explore Posts
              </Button>
            </Link>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={itemVariants} className="mx-auto max-w-xl">
            <SearchBar />
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-3 gap-8 border-t pt-12"
          >
            {[
              { value: "10K+", label: "Writers" },
              { value: "50K+", label: "Articles" },
              { value: "1M+", label: "Readers" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
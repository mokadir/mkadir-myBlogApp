"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DashboardFilters } from "@/types";

interface DashboardFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  onFiltersChange?: (filters: DashboardFilters) => void;
}

export function DashboardFilters({
  categories,
  onFiltersChange,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(
    searchParams.get("search") || ""
  );
  const [status, setStatus] = React.useState(
    searchParams.get("status") || "all"
  );
  const [category, setCategory] = React.useState(
    searchParams.get("category") || "all"
  );
  const [sort, setSort] = React.useState(
    searchParams.get("sort") || "newest"
  );
  const [showFilters, setShowFilters] = React.useState(false);

  const updateFilters = (updates: Partial<DashboardFilters>) => {
    const newFilters = { search, status, category, sort, ...updates };
    const params = new URLSearchParams();

    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.status !== "all") params.set("status", newFilters.status);
    if (newFilters.category !== "all")
      params.set("category", newFilters.category);
    if (newFilters.sort !== "newest") params.set("sort", newFilters.sort);

    const queryString = params.toString();
    router.push(queryString ? `/dashboard?${queryString}` : "/dashboard");
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    setSort("newest");
    router.push("/dashboard");
    onFiltersChange?.({
      search: "",
      status: "all",
      category: "all",
      sort: "newest",
    });
  };

  const hasActiveFilters =
    search || status !== "all" || category !== "all" || sort !== "newest";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Debounce search
              const timeout = setTimeout(
                () => updateFilters({ search: e.target.value }),
                500
              );
              return () => clearTimeout(timeout);
            }}
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                updateFilters({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-accent" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                updateFilters({ status: e.target.value });
              }}
              className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                updateFilters({ category: e.target.value });
              }}
              className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                updateFilters({ sort: e.target.value });
              }}
              className="w-36 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="self-end"
            >
              <X className="mr-1 h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
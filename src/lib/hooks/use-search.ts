"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SearchResult, SearchSuggestion } from "@/lib/search/search-engine";

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  trending: string[];
  total: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  error: string | null;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [state, setState] = useState<SearchState>({
    query: "",
    results: [],
    suggestions: [],
    trending: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    isLoading: false,
    isSuggestionsLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trending searches on mount
  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/search?type=trending");
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({ ...prev, trending: data.trending }));
      }
    } catch {
      // Silently fail - trending is non-critical
    }
  }, []);

  // Debounced search for suggestions
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.trim().length < minQueryLength) {
        setState((prev) => ({ ...prev, suggestions: [] }));
        return;
      }

      setState((prev) => ({ ...prev, isSuggestionsLoading: true }));

      try {
        const res = await fetch(
          `/api/search?type=suggestions&q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setState((prev) => ({
            ...prev,
            suggestions: data.suggestions,
            isSuggestionsLoading: false,
          }));
        }
      } catch {
        setState((prev) => ({ ...prev, isSuggestionsLoading: false }));
      }
    },
    [minQueryLength]
  );

  // Full search
  const search = useCallback(
    async (
      query: string,
      page = 1,
      filters?: {
        categoryId?: string;
        tag?: string;
        authorId?: string;
        sortBy?: "relevance" | "newest" | "oldest" | "popular";
      }
    ) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({
        ...prev,
        query,
        currentPage: page,
        isLoading: true,
        error: null,
      }));

      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          limit: "10",
        });

        if (filters?.categoryId) params.set("categoryId", filters.categoryId);
        if (filters?.tag) params.set("tag", filters.tag);
        if (filters?.authorId) params.set("authorId", filters.authorId);
        if (filters?.sortBy) params.set("sortBy", filters.sortBy);

        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Search failed");
        }

        const data = await res.json();

        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            results: data.results,
            total: data.total,
            totalPages: data.totalPages,
            isLoading: false,
            error: null,
          }));
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Search failed",
        }));
      }
    },
    []
  );

  // Debounced suggestion fetcher
  const updateQuery = useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, query }));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, debounceMs);
    },
    [fetchSuggestions, debounceMs]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setState({
      query: "",
      results: [],
      suggestions: [],
      trending: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      isLoading: false,
      isSuggestionsLoading: false,
      error: null,
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    search,
    updateQuery,
    clearSearch,
    fetchTrending,
  };
}

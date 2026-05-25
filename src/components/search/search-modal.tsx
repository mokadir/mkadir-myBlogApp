"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  TrendingUp,
  Hash,
  User,
  FileText,
  FolderOpen,
  Loader2,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useSearch } from "@/lib/hooks/use-search";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import type { SearchSuggestion } from "@/lib/search/search-engine";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [hasSearched, setHasSearched] = React.useState(false);

  const {
    query,
    results,
    suggestions,
    trending,
    total,
    totalPages,
    currentPage,
    isLoading,
    isSuggestionsLoading,
    search,
    updateQuery,
    clearSearch,
  } = useSearch({ debounceMs: 350 });

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < getTotalItems() - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : getTotalItems() - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          handleSelectCurrent();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, suggestions, results, selectedIndex]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // This is handled by the parent
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getTotalItems = () => {
    if (hasSearched) return results.length;
    if (query.length >= 2) return suggestions.length;
    return trending.length;
  };

  const handleSelectCurrent = () => {
    if (hasSearched && results[selectedIndex]) {
      router.push(`/posts/${results[selectedIndex].slug}`);
      onClose();
      clearSearch();
    } else if (!hasSearched && suggestions[selectedIndex]) {
      const suggestion = suggestions[selectedIndex];
      if (suggestion.type === "tag") {
        router.push(`/posts?tag=${encodeURIComponent(suggestion.text)}`);
      } else {
        handleSearch(suggestion.text);
      }
      onClose();
      clearSearch();
    }
  };

  const handleSearch = (q: string) => {
    updateQuery(q);
    search(q);
    setHasSearched(true);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateQuery(value);
    setHasSearched(false);
    setSelectedIndex(-1);

    if (value.trim().length >= 2) {
      // Will trigger suggestions via debounce
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "tag") {
      router.push(`/posts?tag=${encodeURIComponent(suggestion.text)}`);
      onClose();
      clearSearch();
    } else {
      handleSearch(suggestion.text);
    }
  };

  const handleResultClick = () => {
    onClose();
    clearSearch();
  };

  const handleTrendingClick = (term: string) => {
    handleSearch(term);
  };

  const handlePageChange = (page: number) => {
    search(query, page);
    setSelectedIndex(-1);
  };

  if (!isOpen) return null;

  const suggestionIcon = (type: string) => {
    switch (type) {
      case "title":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "tag":
        return <Hash className="h-4 w-4 text-green-500" />;
      case "category":
        return <FolderOpen className="h-4 w-4 text-purple-500" />;
      case "author":
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl rounded-xl border bg-background shadow-2xl"
      >
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-b px-4">
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search posts, tags, authors..."
            className="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              className="mr-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </form>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading State */}
          {(isLoading || isSuggestionsLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Search Results */}
          {hasSearched && !isLoading && (
            <>
              {results.length > 0 ? (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}
                      &rdquo;
                    </p>
                  </div>
                  {results.map((result, index) => (
                    <Link
                      key={result.id}
                      href={`/posts/${result.slug}`}
                      onClick={handleResultClick}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent ${
                        index === selectedIndex ? "bg-accent" : ""
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md">
                        {result.coverImage ? (
                          <Image
                            src={result.coverImage}
                            alt={result.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <FileText className="h-5 w-5 text-primary/40" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">
                          {result.title}
                        </h4>
                        {result.excerpt && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {result.excerpt}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{result.author.name}</span>
                          {result.readTime && (
                            <>
                              <span>·</span>
                              <Clock className="h-3 w-3" />
                              <span>{result.readTime} min read</span>
                            </>
                          )}
                          {result.relevanceScore > 0 && (
                            <>
                              <span>·</span>
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                              <span className="text-yellow-600 dark:text-yellow-400">
                                {Math.round(result.relevanceScore)} pts
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {result.tags.length > 0 && (
                        <div className="hidden shrink-0 gap-1 sm:flex">
                          {result.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="px-1.5 py-0 text-[9px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                              page === currentPage
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
            </>
          )}

          {/* Suggestions (before search is executed) */}
          {!hasSearched && !isSuggestionsLoading && query.length >= 2 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Suggestions
                </p>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {suggestionIcon(suggestion.type)}
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">{suggestion.text}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {suggestion.type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.count} post{suggestion.count !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
              {suggestions.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Press Enter to search
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Trending Searches (when no query) */}
          {!hasSearched && query.length < 2 && (
            <div className="py-2">
              {/* Trending */}
              {trending.length > 0 && (
                <div className="px-4 py-2">
                  <div className="mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Trending Searches
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleTrendingClick(term)}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="border-t px-4 py-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Quick Links
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/posts"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 rounded-md bg-accent/50 px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    <FileText className="h-3 w-3" />
                    All Posts
                  </Link>
                  <Link
                    href="/posts?sort=popular"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 rounded-md bg-accent/50 px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Popular
                  </Link>
                </div>
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="border-t px-4 py-3">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                      ↑↓
                    </kbd>{" "}
                    Navigate
                  </span>
                  <span>
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                      ↵
                    </kbd>{" "}
                    Open
                  </span>
                  <span>
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">
                      Esc
                    </kbd>{" "}
                    Close
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

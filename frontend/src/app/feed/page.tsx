"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Plus,
  MessageSquareOff,
  FilterX,
  Compass,
} from "lucide-react";
import api from "@/lib/api";
import { AppHeader } from "@/components/feed/app-header";
import { FeedSidebar, type FeedKey } from "@/components/feed/feed-sidebar";
import { FeedRightSidebar } from "@/components/feed/feed-right-sidebar";
import { CreatePostBar } from "@/components/feed/create-post-bar";
import { PostCard } from "@/components/feed/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn, parsePostTitle } from "@/lib/utils";
import type { PaginatedPostsResponse, SafePost } from "@/types/post";

type SortOption = "hot" | "new" | "top";

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFeed, setActiveFeed] = useState<FeedKey>("home");
  const [activeSort, setActiveSort] = useState<SortOption>("new");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<SafePost[]>([]);

  // Fetch posts from backend GET /api/posts
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{
    posts: SafePost[];
    pagination: PaginatedPostsResponse["pagination"];
  }>({
    queryKey: ["posts", page],
    queryFn: async () => {
      const response = await api.get("/posts", {
        params: { page, limit: 10 },
      });
      const result = response.data?.data as PaginatedPostsResponse;
      if (page === 1) {
        setAllPosts(result.posts || []);
      } else {
        setAllPosts((prev) => {
          const newPosts = result.posts || [];
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newPosts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
      return result;
    },
  });

  // Client-side search & topic filtering
  const displayedPosts = useMemo(() => {
    let posts = allPosts;

    if (selectedTopic) {
      const topicLower = selectedTopic.toLowerCase();
      posts = posts.filter((p) => {
        const { community } = parsePostTitle(p.title);
        return community.toLowerCase() === `t/${topicLower}`;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.content && p.content.toLowerCase().includes(query)) ||
          p.author.username.toLowerCase().includes(query) ||
          p.author.displayName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (activeSort === "hot") {
      // Sort by commentCount and createdAt
      return [...posts].sort((a, b) => b.commentCount - a.commentCount);
    } else if (activeSort === "top") {
      // Sort by title length or comment count
      return [...posts].sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
    }
    // "new" is default (ordered by createdAt from backend)
    return posts;
  }, [allPosts, searchQuery, activeSort, selectedTopic]);

  const hasNextPage = data?.pagination?.hasNextPage ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Application Header */}
      <AppHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Responsive Grid Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="flex gap-6 lg:gap-8 items-start justify-center">
          {/* Left Navigation Sidebar */}
          <FeedSidebar
            currentTopic={selectedTopic}
            onSelectTopic={(topic) => {
              setSelectedTopic(topic);
            }}
            activeFeed={activeFeed}
            onSelectFeed={(feed) => {
              setActiveFeed(feed);
              setSelectedTopic(null);
              if (feed === "home") setActiveSort("new");
              if (feed === "popular") setActiveSort("hot");
              if (feed === "all") setActiveSort("top");
            }}
          />

          {/* Center Column: Feed & Feed Controls */}
          <div className="flex-1 max-w-2xl w-full min-w-0 space-y-4">
            {/* Create Post Action Box */}
            <CreatePostBar />

            {/* Sorting Tabs & Filter Status Bar */}
            <div className="bg-card border border-border/80 rounded-2xl p-1.5 shadow-xs flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSort("new");
                    setActiveFeed("home");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    activeSort === "new"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSort("hot");
                    setActiveFeed("popular");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    activeSort === "hot"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Hot</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSort("top");
                    setActiveFeed("all");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    activeSort === "top"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Top</span>
                </button>
              </div>

              {/* Topic badge if selected */}
              {selectedTopic && (
                <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg text-xs font-medium text-foreground">
                  <span>t/{selectedTopic}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Clear topic filter"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Search feedback if filtered */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-xl text-xs text-foreground">
                <span>
                  Showing results matching <span className="font-bold">"{searchQuery}"</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <FilterX className="w-3 h-3" />
                  <span>Clear search</span>
                </button>
              </div>
            )}

            {/* Loading State: Skeletons */}
            {isLoading && page === 1 && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-card border border-border/70 rounded-2xl p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="w-24 h-4 rounded-md" />
                      <Skeleton className="w-16 h-3 rounded-md" />
                    </div>
                    <Skeleton className="w-3/4 h-6 rounded-md" />
                    <Skeleton className="w-full h-16 rounded-md" />
                    <Skeleton className="w-full h-56 rounded-xl" />
                    <div className="flex gap-3 pt-2">
                      <Skeleton className="w-20 h-7 rounded-full" />
                      <Skeleton className="w-16 h-7 rounded-full" />
                      <Skeleton className="w-16 h-7 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  Unable to load community feed
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {error instanceof Error ? error.message : "Network error contacting Talkora API"}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "text-xs rounded-xl gap-2",
                  })}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Empty State: No posts in database yet */}
            {!isLoading && !isError && allPosts.length === 0 && (
              <div className="bg-card border border-border/80 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-primary mx-auto flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    No discussions found yet
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Be the very first member to spark an idea, start a debate, or launch a topic on Talkora.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/submit"
                    className={buttonVariants({
                      className:
                        "bg-primary hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold rounded-full px-5 h-10 shadow-xs taste-button inline-flex items-center gap-2",
                    })}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create the First Post</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Empty Search Result State */}
            {!isLoading && !isError && allPosts.length > 0 && displayedPosts.length === 0 && (
              <div className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <MessageSquareOff className="w-8 h-8 text-muted-foreground mx-auto" />
                <h3 className="font-serif font-bold text-base text-foreground">
                  No matching discussions
                </h3>
                <p className="text-xs text-muted-foreground">
                  No posts matched your current search criteria. Try a different keyword.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "text-xs rounded-xl",
                  })}
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Post Feed List */}
            {!isLoading && !isError && displayedPosts.length > 0 && (
              <div className="space-y-4">
                {displayedPosts.map((post, idx) => (
                  <PostCard key={post.id} post={post} priority={idx === 0} />
                ))}
              </div>
            )}

            {/* Load More Pagination */}
            {hasNextPage && !searchQuery.trim() && (
              <div className="pt-4 pb-8 flex justify-center">
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => setPage((prev) => prev + 1)}
                  className={buttonVariants({
                    variant: "outline",
                    className:
                      "rounded-full px-6 text-xs font-semibold h-10 gap-2 border-border/80 hover:bg-secondary taste-button",
                  })}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <span>Load more discussions</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Community Info Sidebar */}
          <FeedRightSidebar />
        </div>
      </main>
    </div>
  );
}

"use client";

import { use, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn, parsePostTitle } from "@/lib/utils";
import { AppHeader } from "@/components/feed/app-header";
import { FeedRightSidebar } from "@/components/feed/feed-right-sidebar";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import { CommentSection } from "@/components/comments/comment-section";
import { usePostVote } from "@/hooks/use-post-vote";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import type { SafePost } from "@/types/post";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

function SinglePostContent({ params }: PostPageProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams.postId;

  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { data, isLoading, isError, error } = useQuery<{ post: SafePost }>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const response = await api.get(`/posts/${postId}`);
      return response.data?.data;
    },
  });

  const post = data?.post;

  const { score, userVote, isDownvoteDisabled, handleVote } = usePostVote({
    postId,
    initialScore: post?.score ?? 0,
    initialUserVote: post?.userVote ?? null,
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success("Post URL copied to clipboard");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved posts" : "Saved to your bookmarks");
  };

  const formattedTime = (() => {
    if (!post?.createdAt) return "recently";
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return "recently";
    }
  })();

  const authorInitials = post?.author?.displayName
    ? post.author.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : post?.author?.username?.slice(0, 2).toUpperCase() || "U";

  const { community: communityTag, title: displayTitle } = parsePostTitle(post?.title || "");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="flex gap-6 lg:gap-8 items-start justify-center">
          <FeedSidebar />

          <div className="flex-1 max-w-2xl w-full min-w-0 space-y-4">
            {/* Back Button */}
            <div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to discussions</span>
              </Link>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-28 h-4 rounded-md" />
                </div>
                <Skeleton className="w-4/5 h-8 rounded-md" />
                <Skeleton className="w-full h-24 rounded-md" />
                <Skeleton className="w-full h-64 rounded-xl" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                <h2 className="font-serif font-bold text-lg text-foreground">Post Not Found</h2>
                <p className="text-xs text-muted-foreground">
                  {error instanceof Error ? error.message : "This discussion may have been removed or does not exist."}
                </p>
                <Link
                  href="/feed"
                  className={buttonVariants({
                    size: "sm",
                    className: "rounded-xl text-xs gap-2",
                  })}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Return to Feed</span>
                </Link>
              </div>
            )}

            {/* Post Content */}
            {!isLoading && post && (
              <article className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="flex flex-col sm:flex-row">
                  {/* Voting Gutter (desktop) */}
                  <div className="hidden sm:flex flex-col items-center py-5 px-3 bg-secondary/30 border-r border-border/50 shrink-0 w-12">
                    <button
                      type="button"
                      onClick={(e) => handleVote("UPVOTE", e)}
                      aria-label="Upvote"
                      className={cn(
                        "p-1 rounded-md transition-colors hover:bg-orange-100 dark:hover:bg-orange-950/40",
                        userVote === "UPVOTE" ? "text-orange-600 bg-orange-100/80" : "text-muted-foreground"
                      )}
                    >
                      <ArrowBigUp className={cn("w-6 h-6", userVote === "UPVOTE" && "fill-current")} />
                    </button>
                    <span
                      className={cn(
                        "text-xs font-bold my-1 select-none tabular-nums",
                        userVote === "UPVOTE"
                          ? "text-orange-600"
                          : userVote === "DOWNVOTE"
                          ? "text-blue-600"
                          : "text-foreground"
                      )}
                    >
                      {score}
                    </span>
                    <button
                      type="button"
                      disabled={isDownvoteDisabled}
                      onClick={(e) => handleVote("DOWNVOTE", e)}
                      aria-label="Downvote"
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDownvoteDisabled
                          ? "text-muted-foreground/30 cursor-not-allowed opacity-40 hover:bg-transparent"
                          : userVote === "DOWNVOTE"
                          ? "text-blue-600 bg-blue-100/80 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                          : "text-muted-foreground hover:bg-blue-100 dark:hover:bg-blue-950/40"
                      )}
                    >
                      <ArrowBigDown className={cn("w-6 h-6", userVote === "DOWNVOTE" && "fill-current")} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-5 sm:p-6">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                      <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-full text-[11px] border border-border/60">
                        {communityTag}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5 border border-border/60">
                          {post.author.avatarUrl ? (
                            <AvatarImage src={post.author.avatarUrl} alt={post.author.displayName} />
                          ) : null}
                          <AvatarFallback className="text-[10px] bg-orange-100 text-primary font-bold">
                            {authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground">
                          u/{post.author.username}
                        </span>
                      </div>
                      <span className="text-muted-foreground/60">•</span>
                      <span>{formattedTime}</span>
                    </div>

                    {/* Title */}
                    <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                      {displayTitle}
                    </h1>

                    {/* Text content */}
                    {post.content && (
                      <div className="mt-4 text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                        {post.content}
                      </div>
                    )}

                    {/* Attached Image */}
                    {post.imageUrl && (
                      <div className="mt-5 rounded-2xl overflow-hidden border border-border/80 bg-secondary/30 relative max-h-[500px] flex items-center justify-center">
                        <div className="relative w-full h-80 sm:h-96">
                          <Image
                            src={post.imageUrl}
                            alt={displayTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Mobile voting controls (hidden on sm+) */}
                        <div className="flex sm:hidden items-center bg-secondary/60 rounded-full px-2 py-0.5 border border-border/60">
                          <button
                            type="button"
                            onClick={(e) => handleVote("UPVOTE", e)}
                            aria-label="Upvote"
                            className={cn(
                              "p-1 rounded-full transition-colors",
                              userVote === "UPVOTE" ? "text-orange-600 font-bold" : "text-muted-foreground"
                            )}
                          >
                            <ArrowBigUp className={cn("w-4 h-4", userVote === "UPVOTE" && "fill-current")} />
                          </button>
                          <span
                            className={cn(
                              "text-xs font-bold px-1 tabular-nums",
                              userVote === "UPVOTE"
                                ? "text-orange-600"
                                : userVote === "DOWNVOTE"
                                ? "text-blue-600"
                                : "text-foreground"
                            )}
                          >
                            {score}
                          </span>
                          <button
                            type="button"
                            disabled={isDownvoteDisabled}
                            onClick={(e) => handleVote("DOWNVOTE", e)}
                            aria-label="Downvote"
                            className={cn(
                              "p-1 rounded-full transition-colors",
                              isDownvoteDisabled
                                ? "text-muted-foreground/30 cursor-not-allowed opacity-40 hover:bg-transparent"
                                : userVote === "DOWNVOTE"
                                ? "text-blue-600 font-bold"
                                : "text-muted-foreground hover:text-blue-600"
                            )}
                          >
                            <ArrowBigDown className={cn("w-4 h-4", userVote === "DOWNVOTE" && "fill-current")} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleShare}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSave}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                            isSaved
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                          <span>{isSaved ? "Saved" : "Save"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.commentCount} Comments</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Discussion & Comment System */}
                <CommentSection
                  postId={post.id}
                  initialCommentCount={post.commentCount}
                />
              </article>
            )}
          </div>

          <FeedRightSidebar />
        </div>
      </main>
    </div>
  );
}

export default function SinglePostPage(props: PostPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col">
          <AppHeader />
          <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-full h-48 rounded-2xl" />
          </div>
        </div>
      }
    >
      <SinglePostContent {...props} />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Share2,
  Bookmark,
  ArrowBigUp,
  ArrowBigDown,
  MoreHorizontal,
  ExternalLink,
  Check,
  Copy,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { usePostVote } from "@/hooks/use-post-vote";
import { cn, parsePostTitle } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SafePost } from "@/types/post";

interface PostCardProps {
  post: SafePost;
  priority?: boolean;
}

export function PostCard({ post, priority = false }: PostCardProps) {
  const { score, userVote, isDownvoteDisabled, handleVote } = usePostVote({
    postId: post.id,
    initialScore: post.score ?? 0,
    initialUserVote: post.userVote ?? null,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);
      toast.success("Post link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved posts" : "Saved to your bookmarks");
  };

  const formattedTime = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return "recently";
    }
  })();

  const authorInitials = post.author.displayName
    ? post.author.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : post.author.username.slice(0, 2).toUpperCase();

  // Extract community tag and clean title
  const { community: communityTag, title: displayTitle } = parsePostTitle(post.title);

  const isLongContent = (post.content?.length || 0) > 280;

  return (
    <article className="group bg-card border border-border/80 hover:border-border transition-all duration-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md flex flex-col sm:flex-row">
      {/* Left Voting Gutter (desktop) */}
      <div className="hidden sm:flex flex-col items-center py-4 px-3 bg-secondary/30 border-r border-border/50 shrink-0 w-12">
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

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Top Meta Header */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
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
                <Link
                  href={`/u/${post.author.username}`}
                  className="font-medium text-foreground hover:underline truncate max-w-[140px]"
                >
                  u/{post.author.username}
                </Link>
              </div>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-[11px] text-muted-foreground">{formattedTime}</span>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-1 -mr-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors outline-none"
                aria-label="More post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 p-1 text-xs">
                <DropdownMenuItem
                  onClick={handleShare}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSave}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{isSaved ? "Remove Bookmark" : "Save Post"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Title */}
          <Link href={`/post/${post.id}`} className="block group/title focus-visible:outline-hidden">
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover/title:text-primary transition-colors leading-snug">
              {displayTitle}
            </h2>
          </Link>

          {/* Text Content */}
          {post.content && (
            <div className="mt-2 text-sm text-foreground/85 leading-relaxed font-sans">
              <p className={cn(!isContentExpanded && isLongContent && "line-clamp-3")}>
                {post.content}
              </p>
              {isLongContent && (
                <button
                  type="button"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="text-xs font-semibold text-primary hover:underline mt-1 cursor-pointer"
                >
                  {isContentExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Attached Image */}
          {post.imageUrl && (
            <div className="mt-3.5 rounded-xl overflow-hidden border border-border/80 bg-secondary/30 relative max-h-[480px] flex items-center justify-center">
              <div className="relative w-full h-72 sm:h-96">
                <Image
                  src={post.imageUrl}
                  alt={displayTitle}
                  fill
                  priority={priority}
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover group-hover:scale-[1.015] transition-transform duration-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Bar */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
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

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Comment Button */}
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>
                {post.commentCount} <span className="hidden xs:inline">Comments</span>
              </span>
            </Link>

            {/* Share Button */}
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
                  <span className="hidden xs:inline">Share</span>
                </>
              )}
            </button>

            {/* Save Button */}
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
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* View Full Post Link */}
          <Link
            href={`/post/${post.id}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <span className="hidden md:inline">Open</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

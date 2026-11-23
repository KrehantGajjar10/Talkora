"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { VoteType } from "@/types/post";

interface UsePostVoteOptions {
  postId: string;
  initialScore?: number;
  initialUserVote?: VoteType | null;
}

export function usePostVote({
  postId,
  initialScore = 0,
  initialUserVote = null,
}: UsePostVoteOptions) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Pattern: Storing previous render values to sync state during render without effects
  const [prevProps, setPrevProps] = useState({ initialScore, initialUserVote });
  const [override, setOverride] = useState<{
    rawScore: number;
    userVote: VoteType | null;
  } | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  if (
    prevProps.initialScore !== initialScore ||
    prevProps.initialUserVote !== initialUserVote
  ) {
    setPrevProps({ initialScore, initialUserVote });
    setOverride(null);
  }

  // Track the raw uncapped score internally so transitions (e.g. +2 / -2) remain mathematically correct
  const rawScore = override ? override.rawScore : initialScore;
  // Expose the clamped non-negative score to the UI (never displays below 0)
  const score = Math.max(0, rawScore);
  const userVote = override ? override.userVote : initialUserVote;

  // Downvote is disabled when display score is 0 or less, unless user has already downvoted (allowing unvote)
  const isDownvoteDisabled = score <= 0 && userVote !== "DOWNVOTE";

  const handleVote = async (targetType: VoteType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isAuthenticated) {
      toast.info("Please log in to vote on posts", {
        description: "Join Talkora to participate in discussions and vote on community posts.",
      });
      return;
    }

    // Prevent downvote if counter is at 0 and user hasn't already downvoted
    if (targetType === "DOWNVOTE" && isDownvoteDisabled) {
      return;
    }

    if (isVoting) return;

    // Snapshot current raw score and vote for exact optimistic calculation & rollback
    const previousRawScore = rawScore;
    const previousUserVote = userVote;

    // Calculate optimistic state based on true raw score
    let nextVote: VoteType | null = null;
    let delta = 0;

    if (userVote === targetType) {
      // Unvote: remove current vote
      nextVote = null;
      delta = targetType === "UPVOTE" ? -1 : 1;
    } else if (userVote === null) {
      // New vote
      nextVote = targetType;
      delta = targetType === "UPVOTE" ? 1 : -1;
    } else {
      // Switching vote (DOWNVOTE -> UPVOTE is +2, UPVOTE -> DOWNVOTE is -2)
      nextVote = targetType;
      delta = targetType === "UPVOTE" ? 2 : -2;
    }

    const optimisticRawScore = previousRawScore + delta;

    // Apply optimistic updates immediately
    setOverride({ rawScore: optimisticRawScore, userVote: nextVote });
    setIsVoting(true);

    try {
      if (previousUserVote === targetType) {
        // DELETE /api/posts/:postId/vote
        const res = await api.delete(`/posts/${postId}/vote`);
        if (res.data?.data) {
          setOverride({
            rawScore: res.data.data.score,
            userVote: res.data.data.userVote ?? null,
          });
        }
      } else {
        // POST /api/posts/:postId/vote
        const res = await api.post(`/posts/${postId}/vote`, {
          type: targetType,
        });
        if (res.data?.data) {
          setOverride({
            rawScore: res.data.data.score,
            userVote: res.data.data.userVote,
          });
        }
      }

      // Refresh cached queries in the background
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch {
      // Rollback on failure
      setOverride({ rawScore: previousRawScore, userVote: previousUserVote });
      toast.error("Failed to submit vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  return {
    score,
    userVote,
    isVoting,
    isDownvoteDisabled,
    handleVote,
  };
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  LogIn,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SafeComment, PaginatedCommentsResponse } from "@/types/comment";

interface CommentSectionProps {
  postId: string;
  initialCommentCount?: number;
}

export function CommentSection({ postId, initialCommentCount = 0 }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [newCommentText, setNewCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Fetch comments
  const { data, isLoading, isError, error } = useQuery<PaginatedCommentsResponse>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const response = await api.get(`/posts/${postId}/comments`, {
        params: { page: 1, limit: 50 },
      });
      return response.data?.data as PaginatedCommentsResponse;
    },
  });

  const comments = data?.comments || [];
  const commentCount = data?.pagination?.totalComments ?? initialCommentCount;

  // Mutation: Create comment
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/posts/${postId}/comments`, { content });
      return response.data?.data;
    },
    onSuccess: () => {
      setNewCommentText("");
      toast.success("Comment posted");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to post comment";
      toast.error(msg || "Failed to post comment");
    },
  });

  // Mutation: Edit comment
  const editMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await api.patch(`/comments/${commentId}`, { content });
      return response.data?.data;
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingText("");
      toast.success("Comment updated");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to update comment";
      toast.error(msg || "Failed to update comment");
    },
  });

  // Mutation: Delete comment
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      setDeletingCommentId(null);
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to delete comment";
      toast.error(msg || "Failed to delete comment");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) {
      toast.error("Comment cannot be empty");
      return;
    }
    if (trimmed.length > 5000) {
      toast.error("Comment cannot exceed 5000 characters");
      return;
    }
    createMutation.mutate(trimmed);
  };

  const handleStartEdit = (comment: SafeComment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleSaveEdit = (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      toast.error("Comment cannot be empty");
      return;
    }
    if (trimmed.length > 5000) {
      toast.error("Comment cannot exceed 5000 characters");
      return;
    }
    editMutation.mutate({ commentId, content: trimmed });
  };

  const getInitials = (name?: string, username?: string) => {
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (username || "U").slice(0, 2).toUpperCase();
  };

  return (
    <div className="border-t border-border/80 bg-secondary/15 p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-foreground">
            Discussion ({commentCount})
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Moderated under Talkora Community Charter
        </span>
      </div>

      {/* Comment Form or Guest Callout */}
      {isAuthenticated ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="What are your thoughts on this discussion?..."
              className="rounded-2xl bg-card border-border/80 text-sm resize-none focus-visible:ring-primary/20 pr-4 pb-8"
              disabled={createMutation.isPending}
            />
            <div className="absolute bottom-2.5 right-3 text-[11px] text-muted-foreground select-none">
              <span className={newCommentText.length > 4800 ? "text-destructive font-bold" : ""}>
                {newCommentText.length}
              </span>
              /5,000
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Markdown formatting is supported. Be respectful and constructive.
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!newCommentText.trim() || createMutation.isPending}
              className="rounded-xl text-xs gap-1.5 h-9 px-4 ml-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-border bg-card/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Join the conversation</p>
              <p className="text-xs text-muted-foreground">
                Sign in to post comments and join discussions with the Talkora community.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border/80 hover:bg-secondary transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-24 h-3.5 rounded-md" />
                    <Skeleton className="w-16 h-2.5 rounded-md" />
                  </div>
                </div>
                <Skeleton className="w-full h-8 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-1">
            <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
            <p className="text-xs font-semibold text-destructive">Failed to load comments</p>
            <p className="text-[11px] text-muted-foreground">
              {error instanceof Error ? error.message : "Please try refreshing the page."}
            </p>
          </div>
        )}

        {!isLoading && !isError && comments.length === 0 && (
          <div className="py-10 text-center space-y-2 border border-dashed border-border/70 rounded-2xl bg-card/40">
            <div className="w-10 h-10 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Be the first to share your perspective and get this conversation started!
            </p>
          </div>
        )}

        {!isLoading &&
          comments.map((comment) => {
            const isAuthor = user?.id === comment.author.id;
            const isEditing = editingCommentId === comment.id;
            const isEdited =
              new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() >
              1000;

            const timeAgo = (() => {
              try {
                return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
              } catch {
                return "recently";
              }
            })();

            return (
              <div
                key={comment.id}
                className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-border transition-all space-y-3"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/u/${comment.author.username}`}
                      className="group focus-visible:outline-hidden"
                    >
                      <Avatar className="w-7 h-7 border border-border/60 transition-transform group-hover:scale-105">
                        {comment.author.avatarUrl ? (
                          <AvatarImage
                            src={comment.author.avatarUrl}
                            alt={comment.author.displayName}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px] bg-orange-100 text-primary font-bold">
                          {getInitials(comment.author.displayName, comment.author.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <Link
                        href={`/u/${comment.author.username}`}
                        className="font-bold text-foreground hover:underline"
                      >
                        {comment.author.displayName || comment.author.username}
                      </Link>
                      <span className="text-muted-foreground/60 text-[11px]">
                        @{comment.author.username}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-muted-foreground text-[11px]">{timeAgo}</span>
                      {isEdited && (
                        <span className="text-[10px] text-muted-foreground/75 italic">
                          (edited)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Author actions menu */}
                  {isAuthor && !isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors outline-none cursor-pointer"
                        aria-label="Comment actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 rounded-xl">
                        <DropdownMenuItem
                          onClick={() => handleStartEdit(comment)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCommentId(comment.id)}
                          className="text-xs cursor-pointer text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Comment Body or Inline Editor */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      rows={3}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="rounded-xl bg-secondary/30 text-xs resize-none"
                      disabled={editMutation.isPending}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={editMutation.isPending}
                        className="rounded-lg h-7 px-2.5 text-xs gap-1 text-muted-foreground"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editingText.trim() || editMutation.isPending}
                        className="rounded-lg h-7 px-3 text-xs gap-1"
                      >
                        {editMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Save</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed pl-9">
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deletingCommentId)}
        onOpenChange={(open) => !open && setDeletingCommentId(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Comment?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingCommentId(null)}
              disabled={deleteMutation.isPending}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => deletingCommentId && deleteMutation.mutate(deletingCommentId)}
              disabled={deleteMutation.isPending}
              className="rounded-xl text-xs gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

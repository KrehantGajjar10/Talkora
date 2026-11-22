"use client";

import { use, useState, Suspense } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  User as UserIcon,
  Calendar,
  MessageSquare,
  Share2,
  Settings,
  ArrowLeft,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/feed/app-header";
import { PostCard } from "@/components/feed/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import type { SafePost, PaginatedPostsResponse } from "@/types/post";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  postCount: number;
}

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

function UserProfileContent({ params }: UserProfilePageProps) {
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [isCopied, setIsCopied] = useState(false);

  const isOwnProfile =
    currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  // Fetch user profile from GET /api/users/:username
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    error,
  } = useQuery<{ profile: PublicProfile }>({
    queryKey: ["user-profile", username],
    queryFn: async () => {
      const response = await api.get(`/users/${encodeURIComponent(username)}`);
      return response.data?.data;
    },
  });

  // Fetch recent posts to filter authored posts
  const { data: postsData, isLoading: postsLoading } = useQuery<PaginatedPostsResponse>({
    queryKey: ["user-posts", username],
    queryFn: async () => {
      const response = await api.get("/posts", { params: { limit: 50 } });
      return response.data?.data as PaginatedPostsResponse;
    },
  });

  const profile = profileData?.profile;
  const userPosts = (postsData?.posts || []).filter(
    (p) => p.author.username.toLowerCase() === username.toLowerCase()
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success("Profile link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedJoinDate = (() => {
    if (!profile?.createdAt) return "Recently";
    try {
      return format(new Date(profile.createdAt), "MMMM yyyy");
    } catch {
      return "Recently";
    }
  })();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {profileLoading && (
          <div className="space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="w-48 h-6 rounded-md" />
                  <Skeleton className="w-28 h-4 rounded-md" />
                </div>
              </div>
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="w-full h-40 rounded-2xl" />
                <Skeleton className="w-full h-40 rounded-2xl" />
              </div>
              <Skeleton className="w-full h-64 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error State: User not found */}
        {profileError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="font-serif font-bold text-xl text-foreground">User Not Found</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No Talkora member was found with username &quot;{username}&quot;. The user may have changed their handle or does not exist.
            </p>
            <Link
              href="/feed"
              className={buttonVariants({
                size: "sm",
                className: "rounded-full text-xs px-5 h-9",
              })}
            >
              Return to Feed
            </Link>
          </div>
        )}

        {/* Profile Content */}
        {!profileLoading && profile && (
          <div className="space-y-6">
            {/* Header Profile Card */}
            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs">
              {/* Banner */}
              <div className="h-28 sm:h-36 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 relative p-6 flex items-end">
                <div className="absolute top-4 right-4">
                  <span className="text-[11px] font-semibold bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                    Talkora Member
                  </span>
                </div>
              </div>

              {/* Profile Bar */}
              <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-14">
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-card shadow-md">
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                    ) : null}
                    <AvatarFallback className="bg-orange-100 text-primary text-2xl font-bold rounded-2xl">
                      {getInitials(profile.displayName || profile.username)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h1 className="font-serif text-2xl font-black tracking-tight text-foreground">
                      {profile.displayName}
                    </h1>
                    <p className="text-xs font-semibold text-muted-foreground">
                      u/{profile.username}
                    </p>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleShare}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "text-xs rounded-full gap-1.5 h-9 px-4 taste-button",
                    })}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Profile</span>
                      </>
                    )}
                  </button>

                  {isOwnProfile && (
                    <Link
                      href="/settings"
                      className={buttonVariants({
                        size: "sm",
                        className:
                          "bg-primary hover:bg-orange-600 text-white font-medium text-xs rounded-full gap-1.5 h-9 px-4 shadow-xs taste-button",
                      })}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Bio & Quick Stats */}
              <div className="px-6 pb-6 pt-2 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  {profile.bio ? (
                    <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-sans">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {isOwnProfile
                        ? "You haven't written a biography yet. Click Edit Profile to add one."
                        : `u/${profile.username} hasn't written a bio yet.`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Joined {formattedJoinDate}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.postCount} Discussions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid: Content + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Tabs & Post List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Tabs */}
                <div className="bg-card border border-border/80 rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "posts"
                        ? "bg-primary text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Discussions ({userPosts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("about")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "about"
                        ? "bg-primary text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>About u/{profile.username}</span>
                  </button>
                </div>

                {/* Posts Tab Content */}
                {activeTab === "posts" && (
                  <div className="space-y-4">
                    {postsLoading && (
                      <div className="space-y-4">
                        <Skeleton className="w-full h-36 rounded-2xl" />
                        <Skeleton className="w-full h-36 rounded-2xl" />
                      </div>
                    )}

                    {!postsLoading && userPosts.length === 0 && (
                      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
                        <h3 className="font-serif font-bold text-base text-foreground">
                          No discussions published yet
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          {isOwnProfile
                            ? "You haven't posted any topics on Talkora yet. Start your first discussion now."
                            : `u/${profile.username} hasn't started any discussions yet.`}
                        </p>
                        {isOwnProfile && (
                          <div className="pt-2">
                            <Link
                              href="/submit"
                              className={buttonVariants({
                                size: "sm",
                                className: "rounded-full text-xs px-5 h-9 bg-primary text-white",
                              })}
                            >
                              Create First Post
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {!postsLoading && userPosts.length > 0 && (
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* About Tab Content */}
                {activeTab === "about" && (
                  <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-5 shadow-xs">
                    <h3 className="font-serif font-bold text-base text-foreground">
                      Member Information
                    </h3>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <div>
                        <span className="font-semibold text-foreground block">Display Name</span>
                        <span className="text-muted-foreground">{profile.displayName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Username</span>
                        <span className="text-muted-foreground">u/{profile.username}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Bio</span>
                        <span className="text-muted-foreground">{profile.bio || "None provided"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Account Created</span>
                        <span className="text-muted-foreground">{formattedJoinDate}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Member ID</span>
                        <span className="text-muted-foreground font-mono text-[11px]">{profile.id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Mini Stats Card */}
              <div className="space-y-4">
                <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Community Overview
                  </h4>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
                    <div>
                      <span className="text-lg font-bold text-foreground block">
                        {profile.postCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Discussions
                      </span>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-emerald-600 block">
                        Active
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Status
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    <Link
                      href="/submit"
                      className={buttonVariants({
                        size: "sm",
                        className: "w-full text-xs rounded-xl bg-primary text-white h-9",
                      })}
                    >
                      Start a Discussion
                    </Link>
                  </div>
                </div>

                <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 text-xs text-muted-foreground space-y-1.5">
                  <span className="font-semibold text-foreground block">Talkora Charter</span>
                  <p className="text-[11px] leading-relaxed">
                    All profile posts adhere to community standards and respectful discourse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UserProfilePage(props: UserProfilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col">
          <AppHeader />
          <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-4">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-full h-48 rounded-2xl" />
          </div>
        </div>
      }
    >
      <UserProfileContent {...props} />
    </Suspense>
  );
}

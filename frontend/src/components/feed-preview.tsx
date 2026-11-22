"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Flame,
  Sparkles,
  Trophy,
  TrendingUp,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Share2,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface PostItem {
  id: string;
  community: string;
  author: string;
  timeAgo: string;
  title: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  initialVotes: number;
  commentsCount: number;
}

const mockPosts: PostItem[] = [
  {
    id: "p1",
    community: "t/technology",
    author: "u/ananya_systems",
    timeAgo: "4h ago",
    title: "Why connection pooling with Neon PostgreSQL revolutionized our cold-start performance in serverless APIs",
    content: "We benchmarked pooled vs unpooled queries under 1,000 requests/sec. By offloading session handling to serverless proxies and reducing TCP handshake overhead, p99 latency dropped from 420ms to 24ms. Here is our architectural diagram and query execution plan.",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    imageCaption: "Network routing topology benchmark",
    initialVotes: 0,
    commentsCount: 142,
  },
  {
    id: "p2",
    community: "t/asktalkora",
    author: "u/rohan_craft",
    timeAgo: "6h ago",
    title: "What is an anti-pattern in modern web design that developers love but users quietly hate?",
    content: "For me, it is infinite scroll without URL preservation. You scroll down 40 items, click on a detail page, press Back, and get thrown right back to the top of the feed. What design trend do you wish died yesterday?",
    initialVotes: 0,
    commentsCount: 388,
  },
  {
    id: "p3",
    community: "t/designcraft",
    author: "u/kavita_minimal",
    timeAgo: "9h ago",
    title: "Restraint as a feature: Redesigning our community reading interface with Merriweather and Open Sans",
    content: "We removed all pastel gradient borders, curved bubbles, and distracting floating reaction pills. Instead, we prioritized 65-character line lengths, 1.6 line height, and pure typographic hierarchy. Readers spend 40% more time on long-form articles.",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    imageCaption: "Minimalist reading workbench",
    initialVotes: 0,
    commentsCount: 78,
  },
];

export function FeedPreview() {
  const [activeTab, setActiveTab] = useState<"hot" | "new" | "top" | "rising">("hot");
  const [votesState, setVotesState] = useState<Record<string, { count: number; vote: "up" | "down" | null }>>({
    p1: { count: 0, vote: null },
    p2: { count: 0, vote: null },
    p3: { count: 0, vote: null },
  });

  const handleVote = (postId: string, type: "up" | "down") => {
    const current = votesState[postId] || { count: 0, vote: null };
    const isDownDisabled = current.count <= 0 && current.vote !== "down";
    if (type === "down" && isDownDisabled) {
      return;
    }
    const newVote = current.vote === type ? null : type;
    const baseCount = 0;
    const newCount = Math.max(
      0,
      baseCount + (newVote === "up" ? 1 : newVote === "down" ? -1 : 0)
    );
    setVotesState((prev) => ({
      ...prev,
      [postId]: {
        count: newCount,
        vote: newVote,
      },
    }));
  };

  return (
    <section id="trending" className="py-20 bg-background border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Feed Column */}
          <div className="w-full lg:flex-1 space-y-4">
            {/* Filter Bar (Reddit signature) */}
            <div className="bg-card rounded-xl border border-border p-1.5 flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setActiveTab("hot")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "hot"
                    ? "bg-secondary text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Flame className="w-4 h-4 text-primary" />
                <span>Hot</span>
              </button>
              <button
                onClick={() => setActiveTab("new")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "new"
                    ? "bg-secondary text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>New</span>
              </button>
              <button
                onClick={() => setActiveTab("top")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "top"
                    ? "bg-secondary text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span>Top</span>
              </button>
              <button
                onClick={() => setActiveTab("rising")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "rising"
                    ? "bg-secondary text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Rising</span>
              </button>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {mockPosts.map((post) => {
                const currentVote = votesState[post.id]?.vote || null;
                const currentCount = votesState[post.id]?.count ?? post.initialVotes;

                return (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs hover:border-border/90 taste-card"
                  >
                    <div className="flex">
                      {/* Voting Column */}
                      <div className="w-12 bg-secondary/35 border-r border-border/40 p-2 flex flex-col items-center justify-start gap-1 shrink-0 pt-3.5">
                        <button
                          onClick={() => handleVote(post.id, "up")}
                          className={`p-1 rounded-md transition-colors ${
                            currentVote === "up"
                              ? "text-primary bg-orange-100"
                              : "text-muted-foreground hover:text-primary hover:bg-secondary"
                          }`}
                          title="Upvote"
                        >
                          <ArrowBigUp className="w-5 h-5 fill-current" />
                        </button>
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            currentCount === 0
                              ? "text-foreground"
                              : currentVote === "up"
                              ? "text-primary"
                              : currentVote === "down"
                              ? "text-blue-600"
                              : "text-foreground"
                          }`}
                        >
                          {currentCount}
                        </span>
                        <button
                          disabled={currentCount <= 0 && currentVote !== "down"}
                          onClick={() => handleVote(post.id, "down")}
                          className={`p-1 rounded-md transition-colors ${
                            currentCount <= 0 && currentVote !== "down"
                              ? "text-muted-foreground/30 cursor-not-allowed opacity-40 hover:bg-transparent"
                              : currentVote === "down"
                              ? "text-blue-600 bg-blue-100"
                              : "text-muted-foreground hover:text-blue-600 hover:bg-secondary"
                          }`}
                          title="Downvote"
                        >
                          <ArrowBigDown className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="p-4 sm:p-5 flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-2">
                          <Link
                            href="/register"
                            className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {post.community}
                          </Link>
                          <span className="text-border">•</span>
                          <span className="font-medium">{post.author}</span>
                          <span className="text-border">•</span>
                          <span>{post.timeAgo}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors">
                          <Link href="/login">{post.title}</Link>
                        </h3>

                        {/* Content text */}
                        {post.content && (
                          <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3.5 line-clamp-3">
                            {post.content}
                          </p>
                        )}

                        {/* Image attachment if any */}
                        {post.imageUrl && (
                          <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-border/80 bg-zinc-950 mb-3.5 group">
                            <Image
                              src={post.imageUrl}
                              alt={post.imageCaption || "Post attachment"}
                              fill
                              className="object-cover group-hover:scale-102 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 700px"
                            />
                            {post.imageCaption && (
                              <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded-sm">
                                {post.imageCaption}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground pt-1 border-t border-border/50">
                          <Link
                            href="/login"
                            className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.commentsCount} comments</span>
                          </Link>
                          <Link
                            href="/login"
                            className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </Link>
                          <Link
                            href="/login"
                            className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors ml-auto"
                          >
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Load more prompt */}
            <div className="text-center pt-4">
              <Link
                href="/register"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "w-full sm:w-auto border-border text-foreground hover:bg-secondary rounded-full font-semibold px-8 h-11 taste-button",
                })}
              >
                Sign in to view more discussions & vote
              </Link>
            </div>
          </div>

          {/* Right Sidebar Column (Reddit-style widgets) */}
          <div className="w-full lg:w-80 shrink-0 space-y-5">
            {/* Talkora Charter */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-serif font-bold text-base text-foreground">
                  The Talkora Charter
                </h4>
              </div>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-4">
                Talkora is an independent discussion platform built for depth, curiosity, and authentic discourse. No addictive algorithmic feeds; your communities curate what rises to the top.
              </p>
              <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border pt-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% community upvote-driven ranking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clean media uploads powered by Cloudinary</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Full privacy with strict HTTP-only sessions</span>
                </div>
              </div>
              <Link
                href="/register"
                className={buttonVariants({
                  className:
                    "w-full mt-5 bg-primary hover:bg-orange-600 text-white font-semibold text-xs h-9.5 rounded-full taste-button",
                })}
              >
                Create Talkora Account
              </Link>
            </div>

            {/* Trending Tags */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
              <h4 className="font-serif font-bold text-sm text-foreground mb-3">
                Trending Discussion Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "postgresql",
                  "webdev",
                  "artificial-intelligence",
                  "system-design",
                  "typography",
                  "reading-habits",
                  "open-source",
                  "react19",
                  "local-first",
                ].map((tag) => (
                  <Link
                    key={tag}
                    href="/login"
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-foreground/80 hover:text-primary hover:bg-orange-100/60 text-xs font-medium transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Rules Box */}
            <div className="bg-secondary/40 rounded-2xl border border-border p-5 text-xs text-muted-foreground space-y-2">
              <div className="font-bold text-foreground">Community Etiquette</div>
              <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                <li>Remember the human behind every username.</li>
                <li>Cite sources and provide context when sharing claims.</li>
                <li>Vote based on contribution quality, not mere disagreement.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

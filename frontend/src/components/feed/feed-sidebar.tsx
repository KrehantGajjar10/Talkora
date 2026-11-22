"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Globe2,
  Code2,
  HelpCircle,
  Palette,
  Sparkles,
  TrendingUp,
  BookOpen,
  Info,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedKey = "home" | "popular" | "all";

export interface FeedSidebarProps {
  currentTopic?: string | null;
  onSelectTopic?: (topic: string | null) => void;
  activeFeed?: FeedKey;
  onSelectFeed?: (feed: FeedKey) => void;
}

const FEEDS = [
  { label: "Home", href: "/feed", icon: Home, key: "home" as const },
  { label: "Popular", href: "/feed?sort=hot", icon: Flame, key: "popular" as const },
  { label: "All Discussions", href: "/feed?sort=all", icon: Globe2, key: "all" as const },
];

const COMMUNITIES = [
  {
    name: "t/technology",
    topic: "technology",
    icon: Code2,
    members: "14.2k",
    description: "Hardware, software, dev life",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "t/asktalkora",
    topic: "asktalkora",
    icon: HelpCircle,
    members: "28.5k",
    description: "Open questions and honest answers",
    color: "from-amber-500 to-orange-600",
  },
  {
    name: "t/designcraft",
    topic: "designcraft",
    icon: Palette,
    members: "9.8k",
    description: "Typography, UI polish, critique",
    color: "from-pink-500 to-rose-600",
  },
  {
    name: "t/science",
    topic: "science",
    icon: Sparkles,
    members: "18.1k",
    description: "Astronomy, physics, deep research",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "t/finance",
    topic: "finance",
    icon: TrendingUp,
    members: "11.4k",
    description: "Markets, personal wealth, ideas",
    color: "from-cyan-500 to-blue-600",
  },
  {
    name: "t/bookclub",
    topic: "bookclub",
    icon: BookOpen,
    members: "6.7k",
    description: "Reading lists, essays, reviews",
    color: "from-purple-500 to-violet-600",
  },
];

export function FeedSidebar({
  currentTopic,
  onSelectTopic,
  activeFeed = "home",
  onSelectFeed,
}: FeedSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-20 self-start space-y-6">
      {/* Feeds Section */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5">
          Feeds
        </h3>
        <nav className="space-y-0.5 mt-1">
          {FEEDS.map((feed) => {
            const Icon = feed.icon;
            const isActive =
              pathname === "/feed" &&
              !currentTopic &&
              activeFeed === feed.key;

            return (
              <button
                key={feed.label}
                type="button"
                onClick={() => {
                  onSelectTopic?.(null);
                  onSelectFeed?.(feed.key);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group text-left cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{feed.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Communities Section */}
      <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between px-3 py-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Communities
          </h3>
          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
            {COMMUNITIES.length}
          </span>
        </div>

        <nav className="space-y-1 mt-1">
          {COMMUNITIES.map((community) => {
            const Icon = community.icon;
            const isSelected = currentTopic === community.topic;

            return (
              <button
                key={community.name}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onSelectTopic?.(null);
                  } else {
                    onSelectTopic?.(community.topic);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all group",
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
                      community.color
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="block text-xs font-semibold text-foreground truncate">
                      {community.name}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/80 truncate">
                      {community.members} members
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Policy & Info */}
      <div className="bg-card/60 border border-border/60 rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>Talkora Community</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Open discussions powered by real individuals. Respect one another, verify claims, and build genuine community value.
        </p>
        <div className="pt-2 border-t border-border/50 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Link href="/rules" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Rules</span>
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>Privacy</span>
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </aside>
  );
}

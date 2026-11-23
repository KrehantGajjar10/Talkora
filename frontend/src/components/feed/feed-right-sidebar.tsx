"use client";

import Link from "next/link";
import {
  MessageSquare,
  Plus,
  ShieldCheck,
  Users,
  Radio,
  Calendar,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function FeedRightSidebar() {
  return (
    <aside className="w-80 shrink-0 hidden xl:block sticky top-20 self-start space-y-6">
      {/* Community Info Box */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Banner header */}
        <div className="h-16 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 relative p-4 flex items-end">
          <div className="absolute -bottom-5 left-4 w-11 h-11 rounded-xl bg-card border-2 border-card p-1 shadow-sm">
            <div className="w-full h-full rounded-lg bg-primary flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
          </div>
        </div>

        <div className="pt-7 px-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">
                Talkora Community
              </h3>
              <p className="text-xs text-muted-foreground">t/talkora</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-foreground/80 leading-relaxed font-sans">
            A high-signal social discussion platform where members create, share, and curate meaningful conversations across technology, science, and ideas.
          </p>

          {/* Stats Bar */}
          <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-3 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>24.8k</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Members
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                <span>342 Online</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Active Now
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Community established November 2026</span>
          </div>

          {/* CTA */}
          <div className="mt-4">
            <Link
              href="/submit"
              className={buttonVariants({
                size: "sm",
                className:
                  "w-full bg-primary hover:bg-orange-600 text-white font-medium text-xs h-9 rounded-xl shadow-xs taste-button flex items-center justify-center gap-1.5",
              })}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Discussion</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Rules Box */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
            Community Rules
          </h3>
        </div>

        <ol className="mt-3 space-y-3 text-xs">
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-muted-foreground/80 shrink-0">1.</span>
            <div className="leading-snug">
              <span className="font-semibold text-foreground">Be respectful and civil.</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Attack arguments, never fellow members. Maintain high professional discourse.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-muted-foreground/80 shrink-0">2.</span>
            <div className="leading-snug">
              <span className="font-semibold text-foreground">Source factual claims.</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Link primary documentation or reputable sources when sharing technical assertions.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-muted-foreground/80 shrink-0">3.</span>
            <div className="leading-snug">
              <span className="font-semibold text-foreground">No spam or hidden promos.</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Direct self-promotion is prohibited unless shared in dedicated showcase threads.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-muted-foreground/80 shrink-0">4.</span>
            <div className="leading-snug">
              <span className="font-semibold text-foreground">Check before posting duplicates.</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Use search to keep active discussions consolidated and organized.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Mini Legal Footer */}
      <div className="px-2 text-[11px] text-muted-foreground space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            User Agreement
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/rules" className="hover:text-foreground transition-colors">
            Content Policy
          </Link>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          Talkora Platform © 2026. All rights reserved. Built for thoughtful discussions.
        </p>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-18 md:pb-28 border-b border-border/60">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-orange-400/10 via-amber-300/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-orange-500/5 blur-2xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Value Proposition with Motion */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 border border-orange-200/80 text-orange-900 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Reddit-Inspired Community Discussion Platform</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
              Where curious minds <span className="text-primary italic">converse</span>, discover, and build ideas.
            </h1>

            <p className="font-sans text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Explore vibrant topic-driven spaces. Share thoughtful stories, participate in deep discussions, and discover real perspectives ranked by community upvotes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="/register"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "w-full sm:w-auto bg-primary hover:bg-orange-600 text-white font-medium text-base h-12 px-8 rounded-full shadow-md shadow-orange-500/15 taste-button",
                })}
              >
                Join Talkora Free
              </Link>
              <Link
                href="/#trending"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "w-full sm:w-auto text-foreground border-border/80 hover:bg-secondary/70 h-12 px-6 rounded-full font-medium taste-button",
                })}
              >
                Explore Discussions
              </Link>
            </div>

            {/* Proof Points */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-border/70 max-w-md mx-auto lg:mx-0 text-left">
              <div>
                <div className="font-serif font-bold text-2xl text-foreground">24k+</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Active Members</div>
              </div>
              <div>
                <div className="font-serif font-bold text-2xl text-foreground">180+</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Sub-Communities</div>
              </div>
              <div>
                <div className="font-serif font-bold text-2xl text-foreground">100%</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Algorithm-Free</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Featured Post Card with Motion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Card Badge */}
              <div className="absolute -top-3.5 right-6 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-md">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  #1 Trending on Talkora
                </span>
              </div>

              {/* Reddit Post Card */}
              <div className="bg-card rounded-2xl border border-border shadow-lg shadow-zinc-900/5 overflow-hidden taste-card p-5 sm:p-6">
                {/* Community Meta */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-3">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100/90 text-orange-900 hover:bg-orange-200/90 font-semibold px-2 py-0.5 text-xs rounded-md"
                  >
                    t/technology
                  </Badge>
                  <span className="text-border">•</span>
                  <span className="font-medium text-foreground">u/aarav_dev</span>
                  <span className="text-border">•</span>
                  <span>2h ago</span>
                </div>

                {/* Post Title */}
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors cursor-pointer">
                  Why we switched our discussion engine from heavy monoliths to modern micro-primitives
                </h3>

                {/* Post Excerpt */}
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                  When scaling our social feed to handle 50,000 active concurrent readers, we stripped away bloated abstraction layers and rebuilt around clean database models and edge caching. Here is the full breakdown.
                </p>

                {/* Post Visual Attachment */}
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border/80 bg-zinc-950 mb-4 group">
                  <Image
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
                    alt="Server architecture and network diagram"
                    fill
                    className="object-cover opacity-90 group-hover:scale-103 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 text-white text-xs font-medium">
                    System Architecture v2.4 (High Throughput)
                  </div>
                </div>

                {/* Post Action Footer */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-muted-foreground pt-2 border-t border-border/50">
                  <button className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>248 comments</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md transition-colors ml-auto">
                    <Bookmark className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

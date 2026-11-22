"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Code2,
  HelpCircle,
  Palette,
  Atom,
  TrendingUp,
  BookOpen,
  Users,
  Check,
  Plus,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const communities = [
  {
    id: "tech",
    tag: "t/technology",
    name: "Modern Technology & Code",
    description: "Deep technical debates on software architecture, AI agents, databases, and open source systems.",
    members: "148k",
    postsToday: "182",
    icon: Code2,
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    id: "ask",
    tag: "t/asktalkora",
    name: "Ask Talkora Anything",
    description: "Honest questions, unconventional life stories, career advice, and community wisdom from real people.",
    members: "215k",
    postsToday: "340",
    icon: HelpCircle,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    id: "design",
    tag: "t/designcraft",
    name: "Design Craft & Typography",
    description: "Anti-slop UI design, typography critique, physical product design, and thoughtful digital interfaces.",
    members: "92k",
    postsToday: "94",
    icon: Palette,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "science",
    tag: "t/science",
    name: "Curious Sciences",
    description: "Peer-reviewed findings, aerospace developments, quantum computing breakthroughs, and ecology research.",
    members: "110k",
    postsToday: "128",
    icon: Atom,
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "finance",
    tag: "t/finance",
    name: "Independent Wealth",
    description: "Pragmatic investing, early financial independence, market deep dives, and macroeconomics.",
    members: "76k",
    postsToday: "67",
    icon: TrendingUp,
    gradient: "from-cyan-600 to-blue-700",
  },
  {
    id: "books",
    tag: "t/bookclub",
    name: "The Reading Room",
    description: "Rigorous book discussions, essays, philosophical debates, and curated monthly reads.",
    members: "64k",
    postsToday: "52",
    icon: BookOpen,
    gradient: "from-purple-600 to-violet-700",
  },
];

export function CommunityShowcase() {
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({
    tech: true,
  });

  return (
    <section id="communities" className="py-20 md:py-28 bg-secondary/30 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase font-bold tracking-wider text-primary mb-2">
              Explore Communities
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              Dive into topics shaped by enthusiasts and practitioners.
            </h2>
            <p className="font-sans text-muted-foreground mt-3 text-base">
              Every topic on Talkora has its own dedicated community. Browse the most active hubs or create your own home for conversations.
            </p>
          </div>

          <Link
            href="/register"
            className={buttonVariants({
              variant: "outline",
              className:
                "border-border text-foreground hover:bg-secondary rounded-full font-medium h-10 px-5 shrink-0 self-start md:self-end taste-button",
            })}
          >
            Create a Community
          </Link>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm, idx) => {
            const Icon = comm.icon;
            const isJoined = Boolean(joinedMap[comm.id]);

            return (
              <motion.div
                key={comm.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: "easeOut" }}
                className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-xs hover:border-orange-500/40 taste-card flex flex-col justify-between"
              >
                {/* Card Banner */}
                <div className={`h-16 bg-gradient-to-r ${comm.gradient} relative px-5 flex items-end`}>
                  <div className="w-12 h-12 rounded-xl bg-card border-2 border-card shadow-md flex items-center justify-center translate-y-6 text-foreground">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-8 px-5 pb-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Link
                        href="/register"
                        className="font-serif font-bold text-lg text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {comm.tag}
                      </Link>
                      <Badge variant="secondary" className="text-[11px] font-semibold text-muted-foreground bg-secondary/80">
                        {comm.postsToday} posts today
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground/90 mb-2">
                      {comm.name}
                    </h4>

                    <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {comm.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>{comm.members} members</span>
                    </div>

                    {isJoined ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setJoinedMap((prev) => ({ ...prev, [comm.id]: false }))}
                        className="h-8 rounded-full text-xs font-semibold px-4 taste-button bg-secondary text-foreground hover:bg-secondary/80"
                      >
                        <Check className="w-3 h-3 mr-1 text-emerald-600" />
                        Joined
                      </Button>
                    ) : (
                      <Link
                        href="/register"
                        className={buttonVariants({
                          size: "sm",
                          className:
                            "h-8 rounded-full text-xs font-semibold px-4 taste-button bg-primary hover:bg-orange-600 text-white",
                        })}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Join
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

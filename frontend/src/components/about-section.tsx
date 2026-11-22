"use client";

import Link from "next/link";
import {
  Users,
  Vote,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const pillars = [
  {
    icon: Users,
    title: "Dedicated Community Hubs",
    description:
      "Join sub-communities tailored to exact interests. Whether discussing low-level systems programming or indie book releases, find focused rooms without unrelated noise.",
  },
  {
    icon: Vote,
    title: "Upvote & Downvote Merit",
    description:
      "Replace black-box algorithmic feeds with transparent community voting. Every submission is ranked directly by peer upvotes and downvotes.",
  },
  {
    icon: ImageIcon,
    title: "Rich Discussions & Media",
    description:
      "Express complex thoughts with structured long-form writing or share high-resolution visual evidence, charts, and photographs hosted reliably via Cloudinary.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-Respecting Architecture",
    description:
      "Engineered with strict HTTP-only authentication cookies, cryptographic session tracking on Neon PostgreSQL, and zero intrusive ad-tracking scripts.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-secondary/20 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Built for Meaningful Dialogue</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
            Designed for genuine human connection, not engagement farming.
          </h2>
          <p className="font-sans text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed">
            Talkora blends the open freedom of classic Reddit forums with modern engineering, clean typography, and thoughtful community moderation.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between taste-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100/80 border border-orange-200/60 flex items-center justify-center text-primary mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground mb-2.5">
                    {pillar.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-orange-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="font-serif text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Ready to take part in the conversation?
            </h3>
            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              Create your account in seconds. Share your perspective, start a topic, and connect with fellow enthusiasts today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold px-8 h-12 rounded-full shadow-lg shadow-black/10 transition-all duration-200 taste-button hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base cursor-pointer"
            >
              <span className="text-orange-600 font-bold">Get Started Now</span>
              <ArrowRight className="w-4 h-4 text-orange-600 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

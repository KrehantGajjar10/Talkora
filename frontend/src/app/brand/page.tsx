import Link from "next/link";
import { ArrowLeft, Palette, MessageSquare, Type, Download, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function BrandPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        <div className="border-b border-border/80 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Palette className="w-3.5 h-3.5" />
            <span>Design Assets</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Talkora Brand & Identity Guidelines
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Typography, color theory, and logo standards that define Talkora&apos;s editorial identity.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/85 font-sans">
          {/* Logo Showcase */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Official Logomark & Wordmark
            </h2>
            <div className="bg-card border border-border/80 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <MessageSquare className="w-9 h-9 fill-current" />
                </div>
                <div>
                  <span className="font-serif text-3xl font-black tracking-tight text-foreground block">
                    Talkora
                  </span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Community Platform
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground max-w-xs space-y-1">
                <p>Always maintain clear breathing room equal to half the logomark width.</p>
                <p>Do not skew, rotate, or modify mark gradients.</p>
              </div>
            </div>
          </section>

          {/* Color System */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Color System
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
                <div className="w-full h-16 rounded-xl bg-orange-600 shadow-2xs" />
                <div>
                  <h3 className="font-bold text-xs text-foreground">Vermilion Primary</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">#ea580c / #ff4500</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Community action and energy</p>
                </div>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
                <div className="w-full h-16 rounded-xl bg-zinc-900 shadow-2xs" />
                <div>
                  <h3 className="font-bold text-xs text-foreground">Graphite Ink</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">#18181b / oklch(0.18)</p>
                  <p className="text-[11px] text-muted-foreground mt-1">High-contrast editorial typography</p>
                </div>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3">
                <div className="w-full h-16 rounded-xl bg-orange-50 border border-orange-200 shadow-2xs" />
                <div>
                  <h3 className="font-bold text-xs text-foreground">Warm Paper Ground</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">#fbfbfc / oklch(0.985)</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Soft background for reading comfort</p>
                </div>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <span>Editorial Typography</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                  Headings & Titles
                </span>
                <h3 className="font-serif text-2xl font-bold text-foreground">
                  Merriweather Serif
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conveys thoughtfulness, literary gravitas, and editorial authority across article titles and community headers.
                </p>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                  Body & Navigation
                </span>
                <h3 className="font-sans text-2xl font-semibold text-foreground">
                  Open Sans
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Neutral, legible sans-serif designed for prolonged reading comfort on desktop and mobile screens.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

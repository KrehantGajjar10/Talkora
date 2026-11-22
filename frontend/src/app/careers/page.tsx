import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, MapPin, Clock, ArrowRight, HeartHandshake } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const ROLES = [
  {
    title: "Senior Frontend Engineer (Next.js & React)",
    department: "Engineering",
    location: "Remote",
    type: "Full-Time",
    description:
      "Craft high-performance, accessible web interfaces for Talkora's millions of discussion readers. Deep experience with App Router, TypeScript, and design systems required.",
  },
  {
    title: "Distributed Systems & Backend Engineer",
    department: "Core Platform",
    location: "Remote",
    type: "Full-Time",
    description:
      "Scale our real-time message pipelines, Neon PostgreSQL connections, and Cloudinary media processing engines to handle global discussion throughput.",
  },
  {
    title: "Community & Trust Lead",
    department: "Community Operations",
    location: "Remote",
    type: "Full-Time",
    description:
      "Champion healthy discourse across sub-communities, support volunteer moderators, and develop safety tooling that protects authentic community dialogue.",
  },
];

export default function CareersPage() {
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
            <Briefcase className="w-3.5 h-3.5" />
            <span>Join Our Team</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Careers at Talkora
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Build the next generation of algorithm-free, community-driven social platforms.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/85 font-sans">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Why Work at Talkora?</span>
            </h2>
            <p>
              We are a remote-first team committed to thoughtful product craft. We do not build addictive engagement loops or outrage-maximizing feeds. Instead, we create spaces where curious minds converse, discover, and build ideas together.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Open Positions ({ROLES.length})
            </h2>

            <div className="space-y-4">
              {ROLES.map((role) => (
                <div
                  key={role.title}
                  className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {role.department}
                    </span>
                    <h3 className="font-serif font-bold text-base text-foreground">
                      {role.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {role.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {role.type}
                      </span>
                    </div>
                  </div>

                  <a
                    href="mailto:careers@talkora.example"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all text-foreground shrink-0 self-start sm:self-center"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-secondary/40 border border-border/70 rounded-2xl p-6 text-xs text-muted-foreground space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-primary" />
              <span>General Applications</span>
            </h3>
            <p>
              Don&apos;t see an exact match for your specialty? We are always eager to meet talented developers, designers, and community architects. Send your portfolio or GitHub profile to{" "}
              <span className="font-semibold text-primary">careers@talkora.example</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

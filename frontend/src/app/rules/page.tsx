import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertOctagon, Users2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function RulesPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Community Standards</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Talkora Content Policy & Moderator Code of Conduct
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            The foundation for respectful, high-signal conversations on Talkora
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/85 font-sans">
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Core Content Pillars</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-2">
                <h3 className="font-bold text-sm text-foreground">1. High Signal Over Noise</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Focus on substantive posts that teach, provoke thoughtful debate, or pose honest inquiries. Low-effort memes and repetitive spam are discouraged.
                </p>
              </div>
              <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-2">
                <h3 className="font-bold text-sm text-foreground">2. Cite Primary Sources</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When sharing technical assertions or research claims, include links to documentation, code repositories, or peer-reviewed papers.
                </p>
              </div>
              <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-2">
                <h3 className="font-bold text-sm text-foreground">3. Respectful Disagreement</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Critique the logic or the code, never the individual. Personal attacks, slurs, or harassment result in immediate suspension.
                </p>
              </div>
              <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-2">
                <h3 className="font-bold text-sm text-foreground">4. Authentic Authorship</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Do not copy-paste massive blocks of uncurated automated outputs. We value genuine human insights and authentic perspectives.
                </p>
              </div>
            </div>
          </section>

          <section id="moderator-code" className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" />
              <span>Moderator Code of Conduct</span>
            </h2>
            <p>
              Community moderation is a sacred trust. Moderators on Talkora agree to the following charter:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Objective Enforcement:</strong> Apply rules neutrally without regard to personal opinions, philosophical differences, or commercial interests.
              </li>
              <li>
                <strong className="text-foreground">Transparency in Actions:</strong> Provide clear reasoning whenever a thread is locked or flagged.
              </li>
              <li>
                <strong className="text-foreground">No Paid Influence:</strong> Never accept financial compensation or gifts in exchange for moderating actions or pinned promotional placement.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-destructive" />
              <span>Prohibited Submissions</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Submissions containing malware, phishing lures, doxxing of private personal data, non-consensual media, or copyright violations will be promptly removed upon review.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

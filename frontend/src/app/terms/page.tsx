import Link from "next/link";
import { ArrowLeft, FileCheck, ShieldAlert, Award, Scale, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>User Agreement</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Talkora Terms of Service & Disclosures
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Published: November 2026 • Governing your access to and participation on Talkora
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/85 font-sans">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, or creating an account on Talkora, you agree to comply with and be bound by these Terms of Service. If you do not accept these terms, you should discontinue using the platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>2. User Accounts & Responsibilities</span>
            </h2>
            <p>
              When creating an account, you must provide accurate credentials. You are responsible for safeguarding your login credentials and session keys. Any activities conducted through your authenticated session are your sole responsibility.
            </p>
            <p>
              You must be at least 13 years of age to register or post content on Talkora.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span>3. User Conduct & Content Standards</span>
            </h2>
            <p>
              Talkora is an open discussion platform designed for substantive ideas and genuine inquiry. You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>Post automated spam, deceptive commercial links, or unsolicited affiliate campaigns.</li>
              <li>Attempt to manipulate upvote/downvote scores through bot networks or multi-accounting.</li>
              <li>Upload malicious payloads, viruses, or exploit scripts disguised as media.</li>
              <li>Harass, intimidate, or impersonate other members or administrators.</li>
            </ul>
          </section>

          <section id="security" className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span>4. Security Disclosures & Vulnerability Reporting</span>
            </h2>
            <p>
              Talkora values transparent security engineering. We protect sessions using HTTP-only cookies, strictly sign authorization tokens, and enforce MIME-signature inspection on all file uploads.
            </p>
            <p>
              If you discover a security vulnerability, we invite responsible disclosure. Please send full reproducible steps to{" "}
              <span className="font-semibold text-primary">security@talkora.example</span>. We commit to reviewing reports within 48 hours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span>5. Limitation of Liability</span>
            </h2>
            <p>
              Talkora is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Discussions, opinions, and technical tutorials shared by community members reflect their authors alone.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

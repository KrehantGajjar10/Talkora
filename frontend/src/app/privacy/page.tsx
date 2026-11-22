import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Cookie, Bell } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="border-b border-border/80 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>User Trust & Security</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Talkora Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last modified: November 22, 2026 • Effective immediately across all Talkora services
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-sm leading-relaxed text-foreground/85 font-sans">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>1. Overview & Core Philosophy</span>
            </h2>
            <p>
              At Talkora, privacy is fundamental to open discussions. We believe community members should be able to exchange technical theses, ask genuine questions, and engage with peers without intrusive trackers or algorithmic profiling.
            </p>
            <p>
              This policy explains what information we collect when you use Talkora, how we use it to authenticate and deliver the service, and the controls you retain over your personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <span>2. Information We Collect</span>
            </h2>
            <div className="bg-card border border-border/70 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Account Information
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong className="text-foreground">Authentication Data:</strong> Username, email address, and cryptographically hashed passwords (using industry-standard bcrypt). We never store plaintext passwords.
                </li>
                <li>
                  <strong className="text-foreground">Profile Details:</strong> Display name, optional biography, and avatar images stored securely via Cloudinary.
                </li>
                <li>
                  <strong className="text-foreground">Contributions:</strong> Posts, text submissions, uploaded media, comments, and upvote/downvote interactions recorded to compute community ranking.
                </li>
              </ul>
            </div>
          </section>

          <section id="cookies" className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              <span>3. Cookies & Session Management</span>
            </h2>
            <p>
              Talkora uses strict <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">HTTP-only</code> cookies (`talkora_access` and `talkora_refresh`) exclusively for session authentication and CSRF defense.
            </p>
            <p>
              We do not utilize cross-site tracking cookies, advertising pixels, or third-party behavioral profiling scripts. You may clear your cookies at any time via your browser preferences or by logging out of your Talkora account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <span>4. Data Disclosure & Sharing</span>
            </h2>
            <p>
              Talkora does not sell, rent, or monetize your personal information to third-party data brokers. Information is only shared under the following strict operational boundaries:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Infrastructure Providers:</strong> Database hosting (Neon Serverless PostgreSQL) and content delivery networks (Cloudinary) strictly for hosting and media delivery.
              </li>
              <li>
                <strong className="text-foreground">Legal Obligations:</strong> Compliance with applicable laws, subpoenas, or legal processes when mandatory under legal authority.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <span>5. Your Rights & Account Deletion</span>
            </h2>
            <p>
              You maintain the right to inspect, edit, or permanently remove your submissions and account profile. You can modify your posts or remove images directly from your discussion dashboard.
            </p>
            <p>
              For privacy inquiries or full account deletion requests, you may reach out to our privacy desk at{" "}
              <span className="font-semibold text-primary">privacy@talkora.example</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

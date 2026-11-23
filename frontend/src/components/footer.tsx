"use client";

import Link from "next/link";
import { MessageSquare, Globe } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Footer() {
  const { isAuthenticated } = useAuth();

  const getCommunityLink = (topic: string, isRegister = false) => {
    if (isAuthenticated) {
      return "/feed";
    }
    return isRegister ? "/register" : "/login";
  };

  return (
    <footer className="border-t border-border bg-card text-muted-foreground text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group focus-visible:outline-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4 fill-current" />
              </div>
              <span className="font-serif text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                Talkora
              </span>
            </Link>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-sm">
              Talkora is an open community-based social discussion platform. Designed with editorial typography, genuine discussions, and democratic upvoting.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Global Community Network • English (US)</span>
            </div>
          </div>

          {/* Communities Column (Redirects to Login / Sign In) */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
              Communities
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={getCommunityLink("technology", false)}
                  className="hover:text-primary transition-colors block py-0.5"
                >
                  t/technology
                </Link>
              </li>
              <li>
                <Link
                  href={getCommunityLink("asktalkora", true)}
                  className="hover:text-primary transition-colors block py-0.5"
                >
                  t/asktalkora
                </Link>
              </li>
              <li>
                <Link
                  href={getCommunityLink("designcraft", false)}
                  className="hover:text-primary transition-colors block py-0.5"
                >
                  t/designcraft
                </Link>
              </li>
              <li>
                <Link
                  href={getCommunityLink("science", true)}
                  className="hover:text-primary transition-colors block py-0.5"
                >
                  t/science
                </Link>
              </li>
              <li>
                <Link
                  href={getCommunityLink("bookclub", false)}
                  className="hover:text-primary transition-colors block py-0.5"
                >
                  t/bookclub
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
              Company
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#about" className="hover:text-foreground hover:text-primary transition-colors block py-0.5">
                  About Talkora
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-foreground hover:text-primary transition-colors block py-0.5">
                  Community Careers
                </Link>
              </li>
              <li>
                <Link href="/brand" className="hover:text-foreground hover:text-primary transition-colors block py-0.5">
                  Brand Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety Column */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
              Legal & Safety
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground hover:text-primary transition-colors block py-0.5 font-medium text-foreground/90"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground hover:text-primary transition-colors block py-0.5"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/rules"
                  className="hover:text-foreground hover:text-primary transition-colors block py-0.5"
                >
                  Content Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/rules#moderator-code"
                  className="hover:text-foreground hover:text-primary transition-colors block py-0.5"
                >
                  Moderator Code of Conduct
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy#cookies"
                  className="hover:text-foreground hover:text-primary transition-colors block py-0.5"
                >
                  Cookie Preferences
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-muted-foreground">
            © 2026 Talkora, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            <span>•</span>
            <Link href="/terms#security" className="hover:text-foreground transition-colors">
              Security Disclosures
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { MessageSquare, Heart, Shield, FileText, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card text-muted-foreground text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
                <MessageSquare className="w-4 h-4 fill-current" />
              </div>
              <span className="font-serif text-xl font-black tracking-tight text-foreground">
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

          {/* Communities Column */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
              Communities
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#communities" className="hover:text-foreground transition-colors">
                  t/technology
                </Link>
              </li>
              <li>
                <Link href="#communities" className="hover:text-foreground transition-colors">
                  t/asktalkora
                </Link>
              </li>
              <li>
                <Link href="#communities" className="hover:text-foreground transition-colors">
                  t/designcraft
                </Link>
              </li>
              <li>
                <Link href="#communities" className="hover:text-foreground transition-colors">
                  t/science
                </Link>
              </li>
              <li>
                <Link href="#communities" className="hover:text-foreground transition-colors">
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
                <Link href="#about" className="hover:text-foreground transition-colors">
                  About Talkora
                </Link>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Community Careers
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Brand Guidelines
                </span>
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
                <span className="hover:text-foreground transition-colors cursor-pointer font-medium text-foreground/90">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Content Policy
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Moderator Code of Conduct
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Cookie Preferences
                </span>
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
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Terms of Use
            </span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Security Disclosures
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Compass, Flame, Info, Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              Talkora
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold -mt-1 hidden sm:block">
              Community
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link
            href="/#about"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors py-1"
          >
            <Info className="w-4 h-4 text-primary" />
            About Us
          </Link>
          <Link
            href="/#communities"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors py-1"
          >
            <Compass className="w-4 h-4 text-primary" />
            Explore Communities
          </Link>
          <Link
            href="/#trending"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors py-1"
          >
            <Flame className="w-4 h-4 text-primary" />
            Trending Topics
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/login"
            className={buttonVariants({
              variant: "ghost",
              className:
                "font-medium text-sm text-foreground hover:bg-secondary/80 px-4 h-9.5 taste-button",
            })}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className={buttonVariants({
              className:
                "bg-primary hover:bg-orange-600 text-white font-medium text-sm px-5 h-9.5 rounded-full shadow-xs hover:shadow-md transition-all taste-button",
            })}
          >
            Sign In
          </Link>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 pt-3 pb-5 space-y-2">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-foreground"
            >
              <Info className="w-4 h-4 text-primary" />
              About Us
            </Link>
            <Link
              href="/#communities"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-foreground"
            >
              <Compass className="w-4 h-4 text-primary" />
              Explore Communities
            </Link>
            <Link
              href="/#trending"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-foreground"
            >
              <Flame className="w-4 h-4 text-primary" />
              Trending Topics
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

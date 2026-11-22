"use client";

import Link from "next/link";
import { Image as ImageIcon, Link2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CreatePostBar() {
  const { user, isAuthenticated } = useAuth();

  const authorInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  const targetUrl = isAuthenticated ? "/submit" : "/login";

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
      {/* User Avatar */}
      <Link href={isAuthenticated ? `/u/${user?.username}` : "/login"} className="shrink-0">
        <Avatar className="w-9 h-9 border border-border/70 hover:opacity-90 transition-opacity">
          {user?.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user?.displayName || "User"} />
          ) : null}
          <AvatarFallback className="bg-orange-100 text-primary text-xs font-bold">
            {authorInitials}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Input mimic */}
      <Link
        href={targetUrl}
        className="flex-1 bg-secondary/60 hover:bg-secondary border border-border/60 hover:border-border rounded-full h-10 px-4 flex items-center text-xs sm:text-sm text-muted-foreground transition-all cursor-text"
      >
        <span>Create Post or share a thought...</span>
      </Link>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={targetUrl}
          aria-label="Create image post"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
        <Link
          href={targetUrl}
          aria-label="Create link post"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Link2 className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}

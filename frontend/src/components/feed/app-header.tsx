"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Plus,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function AppHeader({ searchQuery, onSearchChange }: AppHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link
          href={isAuthenticated ? "/feed" : "/"}
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
              Feed
            </span>
          </div>
        </Link>

        {/* Center: Search Bar */}
        <div className="hidden sm:flex flex-1 max-w-lg items-center relative mx-2">
          <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchQuery ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search discussions, topics, keywords..."
            className="pl-10 h-10 w-full bg-secondary/60 hover:bg-secondary/90 focus:bg-card border-border/70 rounded-full text-sm transition-all focus-visible:ring-primary/40 placeholder:text-muted-foreground/80"
          />
        </div>

        {/* Right: Actions & User Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Create Post Action */}
              <Link
                href="/submit"
                className={buttonVariants({
                  size: "sm",
                  className:
                    "bg-primary hover:bg-orange-600 text-white font-medium text-xs sm:text-sm px-4 h-9 rounded-full shadow-xs taste-button flex items-center gap-1.5",
                })}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Create Post</span>
              </Link>

              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2.5 p-1 md:pr-3 rounded-full hover:bg-secondary/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                  aria-label="User navigation menu"
                >
                  <Avatar className="w-8 h-8 border border-border shrink-0">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    ) : null}
                    <AvatarFallback className="bg-orange-100 text-primary text-xs font-bold">
                      {getInitials(user?.displayName || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col text-left max-w-[200px] min-w-0">
                    <span className="text-xs font-bold text-foreground leading-none truncate">
                      {user?.displayName}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-none mt-1 truncate">
                      u/{user?.username}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block shrink-0" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-1.5 mt-1 bg-card border-border shadow-lg">
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
                    Signed in as <span className="font-bold text-foreground truncate block">u/{user?.username}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/u/${user?.username}`)}
                    className="cursor-pointer px-2 py-2 text-xs font-medium rounded-md hover:bg-secondary flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer px-2 py-2 text-xs font-medium rounded-md hover:bg-secondary flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer px-2 py-2 text-xs font-medium rounded-md text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-destructive" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "font-medium text-xs sm:text-sm px-3.5 h-9 taste-button",
                })}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  size: "sm",
                  className:
                    "bg-primary hover:bg-orange-600 text-white font-medium text-xs sm:text-sm px-4 h-9 rounded-full shadow-xs taste-button",
                })}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

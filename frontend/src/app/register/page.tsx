"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  Quote,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

// Strictly matching backend registerSchema: { email, username, password, displayName }
const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      // Strictly backend POST /api/auth/register with email, username, displayName, password
      const response = await api.post("/auth/register", {
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        password: data.password,
      });

      const user = response.data?.data?.user;
      await checkAuth();
      toast.success(
        user?.displayName
          ? `Welcome to Talkora, ${user.displayName}`
          : "Account created successfully"
      );
      router.push("/feed");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message ||
        "Registration failed. Username or email might already be taken.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background selection:bg-orange-100 selection:text-orange-900">
      {/* Left Column: Creative Editorial Community Showcase */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-stone-900 text-white p-12 flex-col justify-between overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-serif text-2xl font-black tracking-tight text-white">
              Talkora
            </span>
          </Link>
        </div>

        {/* Middle Editorial Highlight */}
        <div className="relative z-10 space-y-6 my-auto">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-orange-400">
            <Quote className="w-5 h-5" />
          </div>
          <blockquote className="font-serif text-2xl font-medium leading-snug text-zinc-100">
            &ldquo;We started our community with 20 peers. Now thousands of creators debate design systems, typography, and frontend performance every week without algorithms suppressing our posts.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3 pt-2">
            <div className="w-11 h-11 rounded-full bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 font-serif font-bold text-base">
              PP
            </div>
            <div>
              <div className="font-medium text-white text-sm">Priya Patel</div>
              <div className="text-xs text-zinc-400">Community Host at t/designcraft • Pune</div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Pillows */}
        <div className="relative z-10 border-t border-white/10 pt-6 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-400" />
            <span>180+ Active Topic Hubs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Tracking Scripts</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean, Taste-Skill Registration Form */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight mb-2.5">
              Join Talkora and share your voice.
            </h1>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Create your account to start topics, vote on posts, and connect with vibrant communities across technology, science, and design.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Display Name
              </label>
              <Input
                {...register("displayName")}
                placeholder="e.g. Priya Patel or Rohan Verma"
                className="h-11 bg-card border-border focus-visible:ring-primary text-sm"
                disabled={isLoading}
                autoFocus
              />
              {errors.displayName && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            {/* Username & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Username
                </label>
                <Input
                  {...register("username")}
                  placeholder="e.g. priya_codes or rohan_v"
                  className="h-11 bg-card border-border focus-visible:ring-primary text-sm"
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-xs text-destructive font-medium mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="e.g. priya.patel@example.com"
                  className="h-11 bg-card border-border focus-visible:ring-primary text-sm"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className="h-11 bg-card border-border focus-visible:ring-primary text-sm pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
              {/* Already have an account placed directly below password */}
              <div className="text-xs text-muted-foreground pt-1.5">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-primary hover:text-orange-600 transition-colors"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-orange-600 text-white font-semibold text-sm h-11 rounded-full shadow-md shadow-orange-500/15 taste-button mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Talkora Account"
              )}
            </Button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
            By creating an account, you agree to our{" "}
            <span className="underline hover:text-foreground cursor-pointer">
              Community Charter
            </span>{" "}
            and{" "}
            <span className="underline hover:text-foreground cursor-pointer">
              Privacy Policy
            </span>
            .
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 Talkora, Inc.</div>
          <div className="flex items-center gap-4">
            <Link href="/#about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">
              Terms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

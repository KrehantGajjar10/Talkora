"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Settings,
  User as UserIcon,
  Shield,
  ArrowLeft,
  Loader2,
  Check,
  Mail,
  LogOut,
  Save,
  Eye,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/feed/app-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Strictly matching backend updateProfileSchema
const settingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters"),
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
  bio: z
    .string()
    .trim()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "account">("profile");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
    },
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user, reset]);

  const watchedDisplayName = useWatch({ control, name: "displayName" }) || "";
  const watchedUsername = useWatch({ control, name: "username" }) || "";
  const watchedBio = useWatch({ control, name: "bio" }) || "";

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare payload with only modified values
      const payload: { displayName?: string; username?: string; bio?: string | null } = {};
      if (data.displayName !== user?.displayName) {
        payload.displayName = data.displayName;
      }
      if (data.username !== user?.username) {
        payload.username = data.username.toLowerCase();
      }
      if (data.bio !== (user?.bio || "")) {
        payload.bio = data.bio === "" ? null : data.bio;
      }

      // If nothing changed, notify user
      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        setIsSubmitting(false);
        return;
      }

      const response = await api.patch("/users/me", payload);
      await checkAuth();

      toast.success("Profile updated successfully!");

      // If username changed, redirect to new profile path
      const updatedUsername = response.data?.data?.profile?.username || data.username;
      router.push(`/u/${updatedUsername}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        toast.error("That username is already taken. Please choose another.");
      } else {
        const message =
          axiosErr.response?.data?.message || "Failed to update profile. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="max-w-md mx-auto w-full px-4 py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-primary mx-auto flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-xl font-bold text-foreground">Authentication Required</h1>
          <p className="text-xs text-muted-foreground">
            Please log in to manage your profile and account settings.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className={buttonVariants({
                className: "rounded-full bg-primary text-white text-xs px-6 h-9",
              })}
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </Link>

          {user?.username && (
            <Link
              href={`/u/${user.username}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Profile</span>
            </Link>
          )}
        </div>

        {/* Page Title */}
        <div className="border-b border-border/80 pb-6 mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Account & Profile Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your identity, bio, and credentials across the Talkora community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Settings Section Nav */}
          <nav className="space-y-1 md:col-span-1">
            <button
              type="button"
              onClick={() => setActiveSection("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === "profile"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Public Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("account")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSection === "account"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Account & Security</span>
            </button>
          </nav>

          {/* Settings Content Area */}
          <div className="md:col-span-3 space-y-6">
            {activeSection === "profile" && (
              <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="font-serif font-bold text-lg text-foreground">Public Profile</h2>
                  <p className="text-xs text-muted-foreground">
                    This information is displayed publicly to members on your profile and discussions.
                  </p>
                </div>

                {/* Avatar Preview */}
                <div className="flex items-center gap-4 pt-2">
                  <Avatar className="w-16 h-16 rounded-2xl border-2 border-border shadow-xs">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    ) : null}
                    <AvatarFallback className="bg-orange-100 text-primary text-lg font-bold rounded-2xl">
                      {getInitials(user?.displayName || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground block">Profile Avatar</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Avatars are synchronized from your account credentials.
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4 border-t border-border/60">
                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-foreground">
                        Display Name <span className="text-destructive">*</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {watchedDisplayName.length}/50
                      </span>
                    </div>
                    <Input
                      {...register("displayName")}
                      placeholder="e.g. Priya Mohan"
                      className="h-10 rounded-xl bg-secondary/30 focus:bg-background border-border/80 text-sm font-medium"
                      maxLength={50}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-destructive font-medium">
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-foreground">
                        Username <span className="text-destructive">*</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {watchedUsername.length}/30
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs text-muted-foreground font-semibold">
                        u/
                      </span>
                      <Input
                        {...register("username")}
                        placeholder="night_arise18"
                        className="pl-8 h-10 rounded-xl bg-secondary/30 focus:bg-background border-border/80 text-sm font-medium"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Lowercase letters, numbers, and underscores only. Changing your username updates your public profile URL.
                    </p>
                    {errors.username && (
                      <p className="text-xs text-destructive font-medium">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-foreground">
                        Biography <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {watchedBio.length}/500
                      </span>
                    </div>
                    <Textarea
                      {...register("bio")}
                      rows={4}
                      placeholder="Tell the community about your technical interests, projects, or background..."
                      className="rounded-xl bg-secondary/30 focus:bg-background border-border/80 text-sm leading-relaxed"
                      maxLength={500}
                    />
                    {errors.bio && (
                      <p className="text-xs text-destructive font-medium">{errors.bio.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm rounded-xl h-10 px-6 shadow-xs taste-button flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "account" && (
              <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="font-serif font-bold text-lg text-foreground">Account & Security</h2>
                  <p className="text-xs text-muted-foreground">
                    Credentials, active session, and sign-out controls.
                  </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/60 text-xs">
                  {/* Email */}
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/70 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">Email Address</span>
                        <span className="text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  </div>

                  {/* Security overview */}
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/70 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Session Encryption</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your authentication is protected by strict HTTP-only session cookies and cryptographic token hashes stored in Neon PostgreSQL.
                    </p>
                  </div>

                  {/* Log Out */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">Sign Out</span>
                      <span className="text-[11px] text-muted-foreground">
                        End your authenticated session on this browser.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-xs font-semibold px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

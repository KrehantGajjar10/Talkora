"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  login: z.string().min(3, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(25, "Username must be at most 25 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onOpenChange,
  defaultTab = "login",
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/login", data);
      const user = response.data?.data?.user;
      toast.success(
        user?.displayName ? `Welcome back, ${user.displayName}!` : "Logged in successfully!"
      );
      resetLoginForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message || "Failed to log in. Please check your credentials.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/register", data);
      const user = response.data?.data?.user;
      toast.success(
        user?.displayName
          ? `Welcome to Talkora, ${user.displayName}!`
          : "Account created successfully!"
      );
      resetSignupForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message || "Registration failed. Try a different username or email.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-xl p-0 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/15 backdrop-blur-xs mb-3 shadow-inner">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="font-serif text-2xl font-bold text-white tracking-tight">
            {activeTab === "login" ? "Welcome Back to Talkora" : "Join the Community"}
          </DialogTitle>
          <DialogDescription className="text-orange-100 text-sm mt-1">
            {activeTab === "login"
              ? "Sign in to upvote, comment, and participate in discussions."
              : "Create an account to build communities and share your voice."}
          </DialogDescription>
        </div>

        <div className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/80 p-1">
              <TabsTrigger value="login" className="text-sm font-medium">
                Log In
              </TabsTrigger>
              <TabsTrigger value="register" className="text-sm font-medium">
                Sign In / Register
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email or Username
                  </label>
                  <Input
                    {...registerLogin("login")}
                    placeholder="e.g. alex@example.com or alex99"
                    className="bg-background border-border focus-visible:ring-primary h-10"
                    disabled={isLoading}
                  />
                  {loginErrors.login && (
                    <p className="text-xs text-destructive font-medium">
                      {loginErrors.login.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                      Forgot?
                    </span>
                  </div>
                  <Input
                    {...registerLogin("password")}
                    type="password"
                    placeholder="Enter your password"
                    className="bg-background border-border focus-visible:ring-primary h-10"
                    disabled={isLoading}
                  />
                  {loginErrors.password && (
                    <p className="text-xs text-destructive font-medium">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-medium h-11 taste-button shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    "Log In to Talkora"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-muted-foreground">
                By logging in, you agree to Talkora&apos;s{" "}
                <span className="underline hover:text-foreground cursor-pointer">
                  Community Rules
                </span>{" "}
                and{" "}
                <span className="underline hover:text-foreground cursor-pointer">
                  Privacy Policy
                </span>
                .
              </div>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleSignupSubmit(onRegister)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <Input
                    {...registerSignup("email")}
                    type="email"
                    placeholder="name@example.com"
                    className="bg-background border-border focus-visible:ring-primary h-10"
                    disabled={isLoading}
                  />
                  {signupErrors.email && (
                    <p className="text-xs text-destructive font-medium">
                      {signupErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Username
                    </label>
                    <Input
                      {...registerSignup("username")}
                      placeholder="u/alex"
                      className="bg-background border-border focus-visible:ring-primary h-10"
                      disabled={isLoading}
                    />
                    {signupErrors.username && (
                      <p className="text-xs text-destructive font-medium">
                        {signupErrors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Display Name
                    </label>
                    <Input
                      {...registerSignup("displayName")}
                      placeholder="Alex Chen"
                      className="bg-background border-border focus-visible:ring-primary h-10"
                      disabled={isLoading}
                    />
                    {signupErrors.displayName && (
                      <p className="text-xs text-destructive font-medium">
                        {signupErrors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <Input
                    {...registerSignup("password")}
                    type="password"
                    placeholder="Min 8 characters"
                    className="bg-background border-border focus-visible:ring-primary h-10"
                    disabled={isLoading}
                  />
                  {signupErrors.password && (
                    <p className="text-xs text-destructive font-medium">
                      {signupErrors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-medium h-11 taste-button shadow-sm mt-1"
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

              <div className="pt-2 text-center text-xs text-muted-foreground">
                Welcome! Joining Talkora is completely free and requires zero tracking permissions.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

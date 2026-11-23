"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  X,
  UploadCloud,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AppHeader } from "@/components/feed/app-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";

// Strictly matching backend createPostSchema
const submitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(300, "Title cannot exceed 300 characters"),
  content: z
    .string()
    .trim()
    .max(20000, "Content cannot exceed 20,000 characters")
    .optional(),
});

type SubmitFormData = z.infer<typeof submitSchema>;

const TOPICS = [
  "technology",
  "asktalkora",
  "designcraft",
  "science",
  "finance",
  "bookclub",
];

export default function SubmitPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState("technology");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const titleValue = useWatch({ control, name: "title" }) || "";
  const contentValue = useWatch({ control, name: "content" }) || "";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image format. Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5 MB.");
      return;
    }

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: SubmitFormData) => {
    if (!isAuthenticated && !authLoading) {
      toast.error("You must be logged in to create a post");
      router.push("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      const trimmedTitle = data.title.trim();
      const hasTag = /^\[t\/[a-zA-Z0-9_-]+\]/i.test(trimmedTitle);
      const formattedTitle = hasTag
        ? trimmedTitle
        : `[t/${selectedTopic.toLowerCase()}] ${trimmedTitle}`;

      const formData = new FormData();
      formData.append("title", formattedTitle.slice(0, 300));
      if (data.content && data.content.trim()) {
        formData.append("content", data.content.trim());
      }
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Discussion published to Talkora!");
      router.push("/feed");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message || "Failed to create post. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to feed</span>
          </Link>
          <span className="text-xs text-muted-foreground">Drafting to Talkora</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground mb-1">
                Create a Discussion
              </h1>
              <p className="text-xs text-muted-foreground mb-6">
                Share a question, technical thesis, or link with the community.
              </p>

              {/* Topic Selector Pills */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Choose a Community Topic
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        selectedTopic === topic
                          ? "bg-primary text-white border-primary shadow-2xs"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border/60"
                      }`}
                    >
                      t/{topic}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Post Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground">
                      Post Title <span className="text-destructive">*</span>
                    </label>
                    <span
                      className={`text-[11px] ${
                        titleValue.length > 280
                          ? "text-destructive font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {titleValue.length}/300
                    </span>
                  </div>
                  <Input
                    {...register("title")}
                    placeholder="An interesting, descriptive title for your discussion..."
                    className="h-11 rounded-xl bg-secondary/30 focus:bg-background border-border/80 text-sm font-medium"
                    maxLength={300}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive font-medium">{errors.title.message}</p>
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground">
                      Body Content <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {contentValue.length}/20,000
                    </span>
                  </div>
                  <Textarea
                    {...register("content")}
                    rows={7}
                    placeholder="Elaborate on your idea, provide context, share code snippets or bullet points..."
                    className="rounded-xl bg-secondary/30 focus:bg-background border-border/80 text-sm leading-relaxed font-sans"
                    maxLength={20000}
                  />
                  {errors.content && (
                    <p className="text-xs text-destructive font-medium">{errors.content.message}</p>
                  )}
                </div>

                {/* Image Upload Box */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Attach Image</span>
                    <span className="text-muted-foreground font-normal text-[11px]">
                      (Optional, max 5 MB)
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-secondary/40 max-h-80 flex items-center justify-center p-2">
                      {/* Preview Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="max-h-72 w-auto object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-foreground/80 hover:bg-foreground text-background transition-colors"
                        aria-label="Remove uploaded image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground group-hover:text-primary">
                          Click to upload
                        </span>{" "}
                        <span className="text-muted-foreground">or drag and drop</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        PNG, JPG or WebP (max 5 MB)
                      </p>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                  <Link
                    href="/feed"
                    className={buttonVariants({
                      variant: "ghost",
                      className: "text-xs rounded-xl h-10 px-4 taste-button",
                    })}
                  >
                    Cancel
                  </Link>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm rounded-xl h-10 px-6 shadow-xs taste-button flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Publish Discussion</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Rules Column */}
          <div className="space-y-6">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground">
                  Posting Guidelines
                </h3>
              </div>

              <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">
                    Use clear, descriptive titles without clickbait.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">
                    Search previous threads before posting to avoid duplication.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">
                    Respect community members and adhere to polite discourse.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">
                    Direct product or affiliate spam will be removed.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Posts are public and accessible to all Talkora readers. You can edit your post text or image at any time from your profile.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

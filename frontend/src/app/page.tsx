import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CommunityShowcase } from "@/components/community-showcase";
import { FeedPreview } from "@/components/feed-preview";
import { AboutSection } from "@/components/about-section";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-orange-100 selection:text-orange-900">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <Hero />

        {/* Communities Discovery Grid */}
        <CommunityShowcase />

        {/* Reddit-style Trending Feed Preview & Community Charter */}
        <FeedPreview />

        {/* About Talkora & Core Pillars */}
        <AboutSection />
      </main>

      {/* Professional Footer with Privacy Policy & Legal Links */}
      <Footer />
    </div>
  );
}

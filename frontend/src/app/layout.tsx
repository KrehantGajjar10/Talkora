import type { Metadata } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Talkora - Where Curious Communities Converse",
  description: "Dive into trending discussions, community sub-talks, upvoted insights, and real conversations on Talkora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${merriweather.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-orange-100 selection:text-orange-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

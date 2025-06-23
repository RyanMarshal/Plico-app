import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";
import AnimatedGradient from "@/components/ui/animated-gradient-optimized";
import { SoundProvider } from "@/contexts/SoundContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { RealtimeManagerProvider } from "@/lib/supabase/realtime-manager";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import dynamic from "next/dynamic";

// Lazy load the sound toggle to avoid hydration issues
const SoundToggle = dynamic(() => import("@/components/ui/sound-toggle"), {
  ssr: false,
  loading: () => <div className="w-9 h-9" />, // Placeholder to prevent layout shift
});

// Lazy load the theme toggle to avoid hydration issues
const ThemeToggle = dynamic(() => import("@/components/ui/theme-toggle"), {
  ssr: false,
  loading: () => <div className="w-9 h-9" />, // Placeholder to prevent layout shift
});

// Lazy load the connection monitor for development/debugging
const RealtimeConnectionMonitor = dynamic(
  () =>
    import("@/components/RealtimeConnectionMonitor").then((mod) => ({
      default: mod.RealtimeConnectionMonitor,
    })),
  {
    ssr: false,
  },
);

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: {
    default: "Plico: Stop arguing. Send a Plico.",
    template: "%s | Plico",
  },
  description:
    "The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  keywords: [
    "polls",
    "voting",
    "quick polls",
    "instant polls",
    "online voting",
    "survey",
    "opinion",
  ],
  authors: [{ name: "Plico Team" }],
  creator: "Plico",
  publisher: "Plico",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Plico: Stop arguing. Send a Plico.",
    description:
      "The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.",
    url: "/",
    siteName: "Plico",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plico: Stop arguing. Send a Plico.",
    description:
      "The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.",
    creator: "@plico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${fredoka.variable} min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RealtimeManagerProvider>
            <SoundProvider>
              <AnimatedGradient />
              <nav className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <a
                        href="/"
                        className="flex items-center"
                      >
                        <img 
                          src="/plico.png" 
                          alt="Plico" 
                          className="h-8 w-auto"
                        />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <SoundToggle />
                    </div>
                  </div>
                </div>
              </nav>
              <main className="relative min-h-screen">{children}</main>
              <RealtimeConnectionMonitor />
            </SoundProvider>
          </RealtimeManagerProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

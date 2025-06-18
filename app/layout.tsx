import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AnimatedGradient from '@/components/ui/animated-gradient-optimized'
import { SoundProvider } from '@/contexts/SoundContext'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import dynamic from 'next/dynamic'

// Lazy load the sound toggle to avoid hydration issues
const SoundToggle = dynamic(() => import('@/components/ui/sound-toggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9" /> // Placeholder to prevent layout shift
})

// Lazy load the theme toggle to avoid hydration issues
const ThemeToggle = dynamic(() => import('@/components/ui/theme-toggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9" /> // Placeholder to prevent layout shift
})

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Plico - Create Quick Polls',
    template: '%s | Plico'
  },
  description: 'Create and share polls instantly. No sign-up required. Get instant results.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  keywords: ['polls', 'voting', 'quick polls', 'instant polls', 'online voting', 'survey', 'opinion'],
  authors: [{ name: 'Plico Team' }],
  creator: 'Plico',
  publisher: 'Plico',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Plico - Create Quick Polls',
    description: 'Create and share polls instantly. No sign-up required. Get instant results.',
    url: '/',
    siteName: 'Plico',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plico - Create Quick Polls',
    description: 'Create and share polls instantly. No sign-up required. Get instant results.',
    creator: '@plico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SoundProvider>
            <AnimatedGradient />
            <nav className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Plico
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <SoundToggle />
                  </div>
                </div>
              </div>
            </nav>
            <main className="relative min-h-screen">
              {children}
            </main>
          </SoundProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
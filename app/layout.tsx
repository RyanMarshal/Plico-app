import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AnimatedGradient from '@/components/ui/animated-gradient-optimized'
import { SoundProvider } from '@/contexts/SoundContext'
import dynamic from 'next/dynamic'

// Lazy load the sound toggle to avoid hydration issues
const SoundToggle = dynamic(() => import('@/components/ui/sound-toggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9" /> // Placeholder to prevent layout shift
})

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Plico - Create Quick Polls',
  description: 'Create and share polls instantly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <SoundProvider>
          <AnimatedGradient />
          <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Plico
                  </a>
                </div>
                <div className="flex items-center">
                  <SoundToggle />
                </div>
              </div>
            </div>
          </nav>
          <main className="relative min-h-screen">
            {children}
          </main>
        </SoundProvider>
      </body>
    </html>
  )
}
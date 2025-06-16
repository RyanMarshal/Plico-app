import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AnimatedGradient from '@/components/ui/animated-gradient'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <AnimatedGradient />
        <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Plico
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="relative min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import ShareButtons from '@/components/plico/ShareButtons'
import { motion, AnimatePresence } from 'framer-motion'
import { MorphLoader } from '@/components/ui/plico-loader'
import dynamic from 'next/dynamic'
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon'

// Lazy load confetti for better performance
const PhysicsConfetti = dynamic(() => import('@/components/ui/physics-confetti'), {
  ssr: false,
  loading: () => null
})

// Helper function to get relative time
function getRelativeTime(closesAt: Date): string {
  const now = new Date()
  const diff = closesAt.getTime() - now.getTime()
  
  if (diff <= 0) return 'Voting has ended'
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `Voting ends in ${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `Voting ends in ${hours} hour${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `Voting ends in ${minutes} minute${minutes > 1 ? 's' : ''}`
  return 'Voting ends soon'
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PlicoWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  // Use party popper emoji for the share page
  useDynamicFavicon('🎉')
  
  const pollUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/poll/${pollId}`
    : ''

  const fetchPoll = useCallback(async () => {
    try {
      const response = await fetch(`/api/plico/${pollId}`)
      if (!response.ok) throw new Error('Failed to load poll')
      const data = await response.json()
      setPoll(data)
    } catch (err) {
      // If poll doesn't exist, redirect to home
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [pollId, router])

  useEffect(() => {
    fetchPoll()
  }, [pollId, fetchPoll])

  const shareOrCopy = async () => {
    // Try native share first on mobile
    if (navigator.share && /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `Poll: ${poll?.question}`,
          text: `Vote on my poll: "${poll?.question}"`,
          url: pollUrl
        })
        return // Exit early if share was successful
      } catch (err) {
        // User cancelled share or share failed, fall through to copy
        if (err instanceof Error && err.name !== 'AbortError') {
          // Share failed, falling back to copy
        }
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(pollUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = pollUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MorphLoader size="lg" />
      </div>
    )
  }

  if (!poll) return null

  return (
    <>
      <PhysicsConfetti 
        isActive={true}
        particleCount={80}
        duration={3000}
        spread={30}
        origin={{ x: 50, y: 10 }}
      />
      <div className="container mx-auto py-12 px-4">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              duration: 0.8,
              bounce: 0.5
            }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 shadow-lg"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <motion.path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </svg>
              </motion.div>
            </motion.div>
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Let the voting begin! 🚀
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 px-4 sm:px-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your #1 job is to share this link with your group.
            </motion.p>
          </motion.div>

          {/* Share Link Component - Hero Element */}
          <motion.div 
            className="mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div 
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-md"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <input
                type="text"
                value={pollUrl}
                readOnly
                className="flex-1 bg-transparent outline-none text-gray-700 font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <motion.button
                onClick={shareOrCopy}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md min-w-[140px] ${
                  copied 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={copied ? 'copied' : 'copy'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <motion.path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2.5} 
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 3.974A9 9 0 113 12a9.001 9.001 0 017.432-3.974m1.867 4.026c.202-.404.316-.86.316-1.342 0-.482-.114-.938-.316-1.342m-1.867 2.684a3 3 0 110-2.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="hidden sm:inline">Copy Link</span>
                        <span className="sm:hidden">Share</span>
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: [
                  "0 0 20px rgba(251, 191, 36, 0.3)",
                  "0 0 40px rgba(251, 191, 36, 0.5)",
                  "0 0 20px rgba(251, 191, 36, 0.3)"
                ]
              }}
              transition={{ 
                delay: 0.65,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <p className="text-sm text-amber-900 dark:text-yellow-100 font-semibold flex items-center gap-2">
                <motion.span 
                  className="text-xl"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  💡
                </motion.span>
                <span>
                  <strong className="text-amber-900 dark:text-yellow-200">Pro tip:</strong> Paste this link directly into your group chat. 
                  No sign-ups required—everyone can vote instantly!
                </span>
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <ShareButtons 
                url={pollUrl} 
                text={`Vote on my poll: "${poll.question}"`}
              />
            </motion.div>
          </motion.div>

          {/* Poll Details Section */}
          <motion.div 
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Your Plico</h2>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{poll.question}</h3>
            
            <div className="space-y-2 mb-4">
              {poll.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>{option.text}</span>
                </motion.div>
              ))}
            </div>
            
            {poll.closesAt && (
              <motion.div 
                className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl">⏱️</span>
                <span>{getRelativeTime(new Date(poll.closesAt))}</span>
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            className="space-y-4 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              onClick={() => router.push(`/poll/${pollId}`)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 min-h-[56px] active:scale-[0.98]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>View Live Poll</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xl"
              >
                →
              </motion.span>
            </motion.button>
            
            <motion.button
              onClick={() => router.push('/')}
              className="w-full bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 py-4 px-6 sm:px-8 rounded-xl font-semibold text-base sm:text-lg border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>✨</span>
              <span>Create Another Plico</span>
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </>
  )
}
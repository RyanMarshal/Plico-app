'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import ShareButtons from '@/components/plico/ShareButtons'
import { motion, AnimatePresence } from 'framer-motion'
import PhysicsConfetti from '@/components/ui/physics-confetti'
import { MorphLoader } from '@/components/ui/plico-loader'

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PlicoWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
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

  const copyToClipboard = async () => {
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
              className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Your Plico is Ready! 🎉
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Share this link with your group to start collecting votes
            </motion.p>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 mb-6 shadow-lg border border-purple-100"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-purple-700 mb-3 font-medium uppercase tracking-wide">Your poll question:</p>
            <motion.p 
              className="text-2xl font-bold text-gray-900 mb-6"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {poll.question}
            </motion.p>
          
            <AnimatePresence>
              {poll.closesAt && (
                <motion.div 
                  className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.p 
                    className="text-sm text-amber-800 font-medium flex items-center justify-center gap-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xl">⏱️</span>
                    This poll will close on {new Date(poll.closesAt).toLocaleDateString()} at {new Date(poll.closesAt).toLocaleTimeString()}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          
            <motion.div 
              className="flex items-center gap-3 bg-white border-2 border-purple-200 rounded-xl p-4 shadow-md"
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
                onClick={copyToClipboard}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
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
                  >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <ShareButtons 
              url={pollUrl} 
              text={`Vote on my poll: "${poll.question}"`}
            />
          </motion.div>

          <motion.div 
            className="space-y-4 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={() => router.push(`/poll/${pollId}`)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                View Poll Results
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
            
            <motion.a
              href="/"
              className="block text-purple-600 hover:text-purple-700 font-semibold text-lg"
              whileHover={{ scale: 1.05 }}
            >
              ✨ Create Another Poll
            </motion.a>
          </motion.div>

          <motion.div 
            className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.p 
              className="text-base text-blue-800 font-medium flex items-start gap-3"
              animate={{ 
                rotate: [0, -1, 1, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <span className="text-2xl flex-shrink-0">💡</span>
              <span>
                <strong>Pro tip:</strong> Paste this link directly into your group chat. 
                No sign-ups required—everyone can vote instantly!
              </span>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
'use client'

import { useState, useCallback, memo } from 'react'
import { PlicoWithResults } from '@/lib/types'
import { setVotedCookie } from '@/lib/cookies'
import CountdownTimer from './CountdownTimer'
import { motion, AnimatePresence } from 'framer-motion'
import { MorphLoader } from '@/components/ui/plico-loader'
import dynamic from 'next/dynamic'
import { useSoundEffects } from '@/hooks/useSoundEffects'

// Lazy load confetti for better performance
const MicroConfetti = dynamic(() => import('@/components/ui/micro-confetti'), {
  ssr: false,
  loading: () => null
})

interface PollViewProps {
  poll: PlicoWithResults
  onVoteComplete: (votedOptionId: string, rollback?: boolean) => void
}

const PollView = memo(function PollView({ poll, onVoteComplete }: PollViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState('')
  const [confettiPosition, setConfettiPosition] = useState<{ x: number; y: number } | null>(null)
  const { playPop } = useSoundEffects()

  const handleVote = useCallback(async (optionId: string, event: React.MouseEvent) => {
    // Get button position for confetti
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    
    setSelectedOption(optionId)
    setIsVoting(true)
    setError('')
    
    // Show micro confetti and play sound
    setConfettiPosition({ x, y })
    playPop()
    
    // Optimistically call onVoteComplete immediately
    onVoteComplete(optionId)
    setVotedCookie(poll.id)

    try {
      const response = await fetch(`/api/plico/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit vote')
      }
      
      // Vote was successful, UI already updated optimistically
    } catch (err) {
      // Vote failed - rollback the optimistic update
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsVoting(false)
      setSelectedOption(null)
      setConfettiPosition(null)
      
      // Rollback the vote
      onVoteComplete(optionId, true)
    }
  }, [poll.id, onVoteComplete, playPop])

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {poll.question}
      </motion.h1>
      
      {poll.closesAt && (
        <motion.div 
          className="mb-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Timer component - onExpire passes 'timer_expired' to onVoteComplete */}
          <CountdownTimer 
            closesAt={new Date(poll.closesAt)} 
            onExpire={() => onVoteComplete('timer_expired')}
          />
        </motion.div>
      )}
      
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {poll.options.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={(e) => handleVote(option.id, e)}
            disabled={isVoting || poll.isClosed}
            aria-label={`Vote for option: ${option.text}`}
            aria-pressed={selectedOption === option.id}
            className={`
              w-full p-6 text-left rounded-2xl border-2 transition-all relative overflow-hidden
              ${selectedOption === option.id 
                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
              }
              ${isVoting || poll.isClosed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={!isVoting && !poll.isClosed ? { 
              scale: 1.02,
              y: -2,
              boxShadow: "0 10px 30px -10px rgba(168, 85, 247, 0.3)"
            } : {}}
            whileTap={!isVoting && !poll.isClosed ? { scale: 0.98 } : {}}
          >
            <span className="text-lg font-medium relative z-10 dark:text-gray-100">{option.text}</span>
            
            {selectedOption === option.id && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="mt-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVoting && (
          <motion.div 
            className="mt-6 flex flex-col items-center justify-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MorphLoader size="sm" />
            <p className="mt-3 text-gray-600 dark:text-gray-400 font-medium">Submitting your vote...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {confettiPosition && (
        <MicroConfetti 
          x={confettiPosition.x} 
          y={confettiPosition.y}
          onComplete={() => setConfettiPosition(null)}
        />
      )}
    </motion.div>
  )
})

export default PollView
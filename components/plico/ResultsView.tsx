'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { PlicoWithResults } from '@/lib/types'
import CountdownTimer from './CountdownTimer'
import { motion, AnimatePresence } from 'framer-motion'
import Drumroll from '@/components/ui/drumroll'
import WinnerSpotlight from '@/components/ui/winner-spotlight'
import PhysicsConfetti from '@/components/ui/physics-confetti'
import TieBreakerWheel from '@/components/ui/tie-breaker-wheel'

interface ResultsViewProps {
  poll: PlicoWithResults
  isCreator: boolean
  onFinalize: () => void
  onTimerExpire?: () => void
}

// Memoize individual option components to prevent re-renders
const PollOption = memo(function PollOption({ 
  option, 
  percentage, 
  animatedVotes, 
  isWinner,
  index 
}: {
  option: any
  percentage: number
  animatedVotes: number
  isWinner: boolean
  index: number
}) {
  return (
    <motion.div
      className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden shadow-lg ${
        isWinner ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200 bg-white'
      }`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isWinner ? [1, 1.02, 1] : 1
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        scale: {
          duration: 0.5,
          delay: 0.2
        }
      }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <WinnerSpotlight winnerText={option.text} isVisible={isWinner} />
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-lg">{option.text}</span>
        <motion.span 
          className="text-base font-bold text-purple-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          {Math.round(animatedVotes)} votes
        </motion.span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden shadow-inner">
        <motion.div
          className={`h-full relative overflow-hidden ${
            isWinner 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-purple-400 to-pink-500'
          }`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: percentage / 100 }}
          style={{ transformOrigin: 'left' }}
          transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'skewX(-25deg)'
            }}
          />
        </motion.div>
      </div>
      
      <motion.div 
        className="mt-2 text-base font-bold text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 + index * 0.1 }}
      >
        <span className={isWinner ? 'text-green-600' : 'text-gray-600'}>
          {percentage.toFixed(1)}%
        </span>
      </motion.div>
      
      {isWinner && (
        <motion.div 
          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            damping: 10,
            stiffness: 100
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              👑
            </motion.span>
            Winner!
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  )
})

export default function ResultsView({ poll, isCreator, onFinalize, onTimerExpire }: ResultsViewProps) {
  const [animatedVotes, setAnimatedVotes] = useState<Record<string, number>>({})
  const [showTieBreaker, setShowTieBreaker] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showDrumroll, setShowDrumroll] = useState(false)
  const [revealResults, setRevealResults] = useState(false)

  const totalVotes = poll.totalVotes || 1

  // Memoize percentage calculation
  const getPercentage = useCallback((voteCount: number) => {
    return totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
  }, [totalVotes])

  // Memoize handler
  const handleDrumrollComplete = useCallback(() => {
    setShowDrumroll(false)
    setRevealResults(true)
  }, [])

  useEffect(() => {
    // Check if this is the first time seeing closed results
    if (poll.isClosed && !revealResults && poll.totalVotes > 0) {
      setShowDrumroll(true)
      return
    }

    const animationDuration = 1000
    const steps = 50
    const stepDuration = animationDuration / steps

    const initialVotes: Record<string, number> = {}
    poll.options.forEach(option => {
      initialVotes[option.id] = 0
    })
    setAnimatedVotes(initialVotes)

    // Use requestAnimationFrame for smoother animations
    let animationFrame: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / animationDuration, 1)

      const newVotes: Record<string, number> = {}
      poll.options.forEach(option => {
        newVotes[option.id] = option.voteCount * progress
      })
      setAnimatedVotes(newVotes)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    // Show winner animations if poll is closed (either finalized or timer expired)
    if (poll.isClosed && revealResults) {
      if (poll.isTie && poll.winner) {
        setTimeout(() => {
          setShowTieBreaker(true)
          setTimeout(() => {
            setShowTieBreaker(false)
          }, 3000)
        }, animationDuration + 500)
      } else if (poll.winner && !poll.isTie) {
        setTimeout(() => {
          setShowConfetti(true)
          setTimeout(() => {
            setShowConfetti(false)
          }, 5000)
        }, animationDuration + 500)
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [poll, revealResults])


  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <motion.h1 
        className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {poll.question}
      </motion.h1>
      
      <AnimatePresence mode="wait">
        {showDrumroll && poll.isClosed ? (
          <Drumroll onComplete={handleDrumrollComplete} duration={2000} />
        ) : null}
      </AnimatePresence>
      
      {poll.closesAt && !poll.isClosed && (
        <div className="mb-6">
          <CountdownTimer 
            closesAt={new Date(poll.closesAt)} 
            onExpire={onTimerExpire || onFinalize}
          />
        </div>
      )}
      
      {(!showDrumroll || !poll.isClosed) && (
        <motion.div 
          className="space-y-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {poll.options.map((option, index) => {
            const percentage = getPercentage(animatedVotes[option.id] || 0)
            const isWinner = poll.isClosed && poll.winner?.id === option.id && revealResults
            
            return (
              <PollOption
                key={option.id}
                option={option}
                percentage={percentage}
                animatedVotes={animatedVotes[option.id] || 0}
                isWinner={isWinner}
                index={index}
              />
            )
          })}
        </motion.div>
      )}

      {(!showDrumroll || !poll.isClosed) && (
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-6 py-3 rounded-full font-semibold shadow-md">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              🗳️
            </motion.span>
            Total votes: {poll.totalVotes}
          </div>
        </motion.div>
      )}

      {!poll.finalized && !poll.closesAt && isCreator && poll.totalVotes > 0 && (
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className="mb-6 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl shadow-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-base text-yellow-800 font-medium">
              🎯 When everyone has voted, click below to finalize the results and declare a winner.
            </p>
          </motion.div>
          <motion.button
            onClick={onFinalize}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎆 Finalize Results
          </motion.button>
        </motion.div>
      )}

      {poll.isClosed && (
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-medium">
            <span className="text-lg">🏏</span>
            {poll.finalized && poll.finalizedAt
              ? `Results finalized on ${new Date(poll.finalizedAt).toLocaleDateString()}`
              : poll.closesAt
              ? `Voting ended on ${new Date(poll.closesAt).toLocaleDateString()} at ${new Date(poll.closesAt).toLocaleTimeString()}`
              : 'Voting has ended'}
          </div>
        </motion.div>
      )}

      <TieBreakerWheel
        options={poll.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }))}
        winnerId={poll.winner?.id || ''}
        isVisible={showTieBreaker}
        onComplete={() => setShowTieBreaker(false)}
      />

      <PhysicsConfetti 
        isActive={showConfetti}
        particleCount={150}
        duration={5000}
        spread={45}
        origin={{ x: 50, y: 30 }}
      />

    </div>
  )
}
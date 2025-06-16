'use client'

import { useEffect, useState, memo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSoundEffects } from '@/hooks/useSoundEffects'

interface CountdownTimerProps {
  closesAt: Date
  onExpire?: () => void
}

const CountdownTimer = memo(function CountdownTimer({ closesAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isUrgent, setIsUrgent] = useState(false)
  const { playTick, playHeartbeat } = useSoundEffects()
  const lastTickSecond = useRef<number>(-1)

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime()
    const target = new Date(closesAt).getTime()
    const difference = target - now

    if (difference <= 0) {
      setTimeLeft(0)
      if (onExpire) onExpire()
      return 0
    }

    const seconds = Math.floor(difference / 1000)
    
    // Play tick sound for final 5 seconds
    if (seconds <= 5 && seconds > 0 && seconds !== lastTickSecond.current) {
      if (seconds <= 3) {
        playHeartbeat() // More urgent sound for final 3 seconds
      } else {
        playTick()
      }
      lastTickSecond.current = seconds
    }
    
    setIsUrgent(difference <= 20000) // 20 seconds
    return difference
  }, [closesAt, onExpire, playTick, playHeartbeat])

  useEffect(() => {

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateTimeLeft])

  if (timeLeft === 0) {
    return (
      <div className="text-center py-4 px-6 bg-red-100 dark:bg-red-900/30 rounded-lg">
        <p className="text-red-800 dark:text-red-300 font-semibold">Voting has ended</p>
      </div>
    )
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return (
    <motion.div 
      className={`text-center py-4 px-6 rounded-lg transition-colors ${
        isUrgent 
          ? 'bg-red-100 dark:bg-red-900/30' 
          : 'bg-blue-100 dark:bg-blue-900/30'
      }`}
      animate={isUrgent ? {
        scale: [1, 1.02, 1],
      } : {}}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        Time remaining
      </p>
      <motion.p 
        className={`text-3xl font-bold ${
          isUrgent ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
        }`}
        key={formatTime()}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {formatTime()}
      </motion.p>
    </motion.div>
  )
})

export default CountdownTimer
'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  closesAt: Date
  onExpire?: () => void
}

export default function CountdownTimer({ closesAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(closesAt).getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft(0)
        if (onExpire) onExpire()
        return 0
      }

      setIsUrgent(difference <= 30000) // 30 seconds
      return difference
    }

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
  }, [closesAt, onExpire])

  if (timeLeft === 0) {
    return (
      <div className="text-center py-4 px-6 bg-red-100 rounded-lg">
        <p className="text-red-800 font-semibold">Voting has ended</p>
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
    <div className={`text-center py-4 px-6 rounded-lg transition-all ${
      isUrgent 
        ? 'bg-red-100 animate-pulse' 
        : 'bg-blue-100'
    }`}>
      <p className="text-sm font-medium text-gray-600 mb-1">
        Time remaining
      </p>
      <p className={`text-3xl font-bold ${
        isUrgent ? 'text-red-600' : 'text-blue-600'
      }`}>
        {formatTime()}
      </p>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { PlicoWithResults } from '@/lib/types'

interface ResultsViewProps {
  poll: PlicoWithResults
  isCreator: boolean
  onFinalize: () => void
}

export default function ResultsView({ poll, isCreator, onFinalize }: ResultsViewProps) {
  const [animatedVotes, setAnimatedVotes] = useState<Record<string, number>>({})
  const [showTieBreaker, setShowTieBreaker] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const totalVotes = poll.totalVotes || 1

  useEffect(() => {
    const animationDuration = 1000
    const steps = 50
    const stepDuration = animationDuration / steps

    const initialVotes: Record<string, number> = {}
    poll.options.forEach(option => {
      initialVotes[option.id] = 0
    })
    setAnimatedVotes(initialVotes)

    const intervals: NodeJS.Timeout[] = []

    poll.options.forEach(option => {
      let currentStep = 0
      const targetVotes = option.voteCount
      const increment = targetVotes / steps

      const interval = setInterval(() => {
        currentStep++
        setAnimatedVotes(prev => ({
          ...prev,
          [option.id]: Math.min(currentStep * increment, targetVotes)
        }))

        if (currentStep >= steps) {
          clearInterval(interval)
        }
      }, stepDuration)

      intervals.push(interval)
    })

    // Only show winner animations if poll is finalized
    if (poll.finalized) {
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
      intervals.forEach(clearInterval)
    }
  }, [poll])

  const getPercentage = (voteCount: number) => {
    return totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-8">{poll.question}</h1>
      
      <div className="space-y-4 mb-6">
        {poll.options.map((option) => {
          const percentage = getPercentage(animatedVotes[option.id] || 0)
          const isWinner = poll.finalized && poll.winner?.id === option.id
          
          return (
            <div
              key={option.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{option.text}</span>
                <span className="text-sm font-semibold">
                  {Math.round(animatedVotes[option.id] || 0)} votes
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    isWinner ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="mt-1 text-sm text-gray-600 text-right">
                {percentage.toFixed(1)}%
              </div>
              
              {isWinner && poll.finalized && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Winner!
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-center text-gray-600">
        Total votes: {poll.totalVotes}
      </div>

      {!poll.finalized && isCreator && poll.totalVotes > 0 && (
        <div className="mt-8 text-center">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              When everyone has voted, click below to finalize the results and declare a winner.
            </p>
          </div>
          <button
            onClick={onFinalize}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Finalize Results
          </button>
        </div>
      )}

      {poll.finalized && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Results finalized on {new Date(poll.finalizedAt!).toLocaleDateString()}
          </p>
        </div>
      )}

      {showTieBreaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center animate-bounce">
            <h2 className="text-3xl font-bold mb-4">It's a tie! 🎲</h2>
            <p className="text-lg">Breaking the tie...</p>
            <div className="mt-4 text-4xl animate-spin">🎰</div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div
                className="text-2xl"
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              >
                {['🎉', '🎊', '✨', '🌟'][Math.floor(Math.random() * 4)]}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-timing-function: linear;
        }
      `}</style>
    </div>
  )
}
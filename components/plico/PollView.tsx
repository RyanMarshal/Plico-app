'use client'

import { useState } from 'react'
import { PlicoWithResults } from '@/lib/types'
import { setVotedCookie } from '@/lib/cookies'

interface PollViewProps {
  poll: PlicoWithResults
  onVoteComplete: () => void
}

export default function PollView({ poll, onVoteComplete }: PollViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState('')

  const handleVote = async (optionId: string) => {
    setSelectedOption(optionId)
    setIsVoting(true)
    setError('')

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

      setVotedCookie(poll.id)
      onVoteComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsVoting(false)
      setSelectedOption(null)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-8">{poll.question}</h1>
      
      <div className="space-y-4">
        {poll.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={isVoting}
            className={`
              w-full p-6 text-left rounded-lg border-2 transition-all
              ${selectedOption === option.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-lg">{option.text}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isVoting && (
        <div className="mt-6 text-center text-gray-600">
          Submitting your vote...
        </div>
      )}
    </div>
  )
}
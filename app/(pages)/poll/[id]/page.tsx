'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import { hasVoted } from '@/lib/cookies'
import PollView from '@/components/plico/PollView'
import ResultsView from '@/components/plico/ResultsView'

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PlicoWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (hasVoted(pollId)) {
      setShowResults(true)
    }
    fetchPoll()
  }, [pollId])

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/plico/${pollId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Poll not found')
        }
        throw new Error('Failed to load poll')
      }
      const data = await response.json()
      setPoll(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteComplete = () => {
    fetchPoll()
    setShowResults(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error === 'Poll not found' ? 'Poll Not Found' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create a New Poll
          </a>
        </div>
      </div>
    )
  }

  if (!poll) {
    return null
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {showResults ? (
        <ResultsView poll={poll} />
      ) : (
        <PollView poll={poll} onVoteComplete={handleVoteComplete} />
      )}
      
      <div className="text-center mt-8">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create your own poll →
        </a>
      </div>
    </div>
  )
}
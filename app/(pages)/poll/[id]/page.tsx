'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import { hasVoted, getCreatorId } from '@/lib/cookies'
import PollView from '@/components/plico/PollView'
import ResultsView from '@/components/plico/ResultsView'

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PlicoWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

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
      
      // Check if current user is the creator
      const creatorId = getCreatorId(pollId)
      setIsCreator(data.creatorId ? creatorId === data.creatorId : false)
      
      // If poll is closed and user hasn't voted, show results
      if (data.isClosed && !hasVoted(pollId)) {
        setShowResults(true)
      }
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

  const handleFinalize = async () => {
    if (!poll || !isCreator) return

    try {
      const creatorId = getCreatorId(pollId)
      const response = await fetch(`/api/plico/${pollId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId })
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to finalize poll')
        return
      }

      // Refresh poll data to show finalized state
      await fetchPoll()
    } catch (err) {
      alert('Failed to finalize poll')
    }
  }

  const handleTimerExpire = () => {
    // Refresh poll data when timer expires to get updated isClosed status
    fetchPoll()
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
        <ResultsView 
          poll={poll} 
          isCreator={isCreator}
          onFinalize={handleFinalize}
          onTimerExpire={handleTimerExpire}
        />
      ) : (
        <PollView poll={poll} onVoteComplete={handleVoteComplete} />
      )}
      
      <div className="text-center mt-8 space-y-4">
        <button
          onClick={() => window.location.href = `/poll/${pollId}/share`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 3.974A9 9 0 113 12a9.001 9.001 0 017.432-3.974m1.867 4.026c.202-.404.316-.86.316-1.342 0-.482-.114-.938-.316-1.342m-1.867 2.684a3 3 0 110-2.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Share Poll
        </button>
        
        <div>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your own poll →
          </a>
        </div>
      </div>
    </div>
  )
}
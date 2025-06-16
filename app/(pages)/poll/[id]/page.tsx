'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import { hasVoted, getCreatorId } from '@/lib/cookies'
import PollView from '@/components/plico/PollView'
import ResultsView from '@/components/plico/ResultsView'
import { motion } from 'framer-motion'
import { MorphLoader } from '@/components/ui/plico-loader'

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  const [poll, setPoll] = useState<PlicoWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  const fetchPoll = useCallback(async () => {
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
  }, [pollId])

  useEffect(() => {
    if (hasVoted(pollId)) {
      setShowResults(true)
    }
    fetchPoll()
  }, [pollId, fetchPoll])

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
          <MorphLoader size="lg" />
          <motion.p 
            className="text-gray-600 mt-4 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading poll...
          </motion.p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-6xl mb-4"
          >
            😕
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {error === 'Poll not found' ? 'Poll Not Found' : 'Oops! Something went wrong'}
          </h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <motion.a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create a New Poll →
          </motion.a>
        </motion.div>
      </div>
    )
  }

  if (!poll) {
    return null
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.div>
      
      <motion.div 
        className="text-center mt-12 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => window.location.href = `/poll/${pollId}/share`}
          className="inline-flex items-center px-6 py-3 border-2 border-purple-300 text-base font-semibold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 3.974A9 9 0 113 12a9.001 9.001 0 017.432-3.974m1.867 4.026c.202-.404.316-.86.316-1.342 0-.482-.114-.938-.316-1.342m-1.867 2.684a3 3 0 110-2.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </motion.svg>
          Share Poll with Friends
        </motion.button>
        
        <div>
          <motion.a
            href="/"
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg"
            whileHover={{ scale: 1.05 }}
          >
            ✨ Create your own poll →
          </motion.a>
        </div>
      </motion.div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PlicoWithResults } from '@/lib/types'
import ShareButtons from '@/components/plico/ShareButtons'

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

  useEffect(() => {
    fetchPoll()
  }, [pollId])

  const fetchPoll = async () => {
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
  }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!poll) return null

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Poll is Ready!
          </h1>
          <p className="text-lg text-gray-600">
            Share this link with your group to start collecting votes
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Your poll question:</p>
          <p className="text-lg font-medium text-gray-900 mb-4">{poll.question}</p>
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
            <input
              type="text"
              value={pollUrl}
              readOnly
              className="flex-1 bg-transparent outline-none text-gray-700"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <ShareButtons 
          url={pollUrl} 
          text={`Vote on my poll: "${poll.question}"`}
        />

        <div className="space-y-3 mt-8">
          <button
            onClick={() => router.push(`/poll/${pollId}`)}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50"
          >
            Go to Poll
          </button>
          
          <a
            href="/"
            className="block text-blue-600 hover:text-blue-700 font-medium"
          >
            Create Another Poll
          </a>
        </div>

        <div className="mt-12 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Pro tip:</strong> Paste this link directly into your group chat. 
            No sign-ups required—everyone can vote instantly!
          </p>
        </div>
      </div>
    </div>
  )
}
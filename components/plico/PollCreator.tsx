'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { setCreatorCookie } from '@/lib/cookies'

const MAX_QUESTION_LENGTH = 280
const MAX_OPTION_LENGTH = 80
const MAX_OPTIONS = 4

const TIMER_OPTIONS = [
  { label: 'No Timer', value: 0 },
  { label: '2 minutes', value: 2 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '1 hour', value: 60 }
]

export default function PollCreator() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(0) // default to "No Timer"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, ''])
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const filledOptions = options.filter(opt => opt.trim())
    
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 options')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/plico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          options: filledOptions,
          duration: duration > 0 ? duration : undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create poll')
      }

      const plico = await response.json()
      
      // Set creator cookie
      setCreatorCookie(plico.id, plico.creatorId)
      
      router.push(`/poll/${plico.id}/share`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <label htmlFor="question" className="block text-sm font-medium mb-2">
          Poll Question
        </label>
        <div className="relative">
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's your poll question?"
            className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            required
          />
          <div className="absolute bottom-2 right-2 text-sm text-gray-500">
            {question.length}/{MAX_QUESTION_LENGTH}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Options</label>
        {options.map((option, index) => (
          <div key={index} className="relative">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full px-4 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={MAX_OPTION_LENGTH}
              required={index < 2}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {option.length}/{MAX_OPTION_LENGTH}
              </span>
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
          >
            + Add Option
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Poll Timer (Optional)</label>
        <p className="text-sm text-gray-600">Set a countdown timer to create urgency</p>
        <div className="grid grid-cols-3 gap-2">
          {TIMER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDuration(option.value)}
              className={`py-2 px-4 rounded-lg font-medium transition-all ${
                duration === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : 'Create Poll'}
      </button>
    </form>
  )
}
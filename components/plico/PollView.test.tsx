import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PollView from './PollView'
import { setVotedCookie } from '@/lib/cookies'

jest.mock('@/lib/cookies', () => ({
  setVotedCookie: jest.fn()
}))

const mockPoll = {
  id: 'test-poll-123',
  question: 'What is your favorite color?',
  options: [
    { id: 'opt-1', text: 'Red', voteCount: 0, plicoId: 'test-poll-123', createdAt: new Date(), updatedAt: new Date() },
    { id: 'opt-2', text: 'Blue', voteCount: 0, plicoId: 'test-poll-123', createdAt: new Date(), updatedAt: new Date() },
    { id: 'opt-3', text: 'Green', voteCount: 0, plicoId: 'test-poll-123', createdAt: new Date(), updatedAt: new Date() }
  ],
  totalVotes: 0,
  isTie: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('PollView', () => {
  const mockOnVoteComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays the poll question and options', () => {
    render(<PollView poll={mockPoll} onVoteComplete={mockOnVoteComplete} />)
    
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
  })

  it('handles successful vote submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, voteCount: 1 })
      })
    ) as jest.Mock

    render(<PollView poll={mockPoll} onVoteComplete={mockOnVoteComplete} />)
    
    const blueOption = screen.getByText('Blue')
    fireEvent.click(blueOption)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/plico/test-poll-123/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: 'opt-2' })
      })
    })
    
    await waitFor(() => {
      expect(setVotedCookie).toHaveBeenCalledWith('test-poll-123')
      expect(mockOnVoteComplete).toHaveBeenCalled()
    })
  })

  it('displays error on failed vote submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Vote failed' })
      })
    ) as jest.Mock

    render(<PollView poll={mockPoll} onVoteComplete={mockOnVoteComplete} />)
    
    const redOption = screen.getByText('Red')
    fireEvent.click(redOption)
    
    await waitFor(() => {
      expect(screen.getByText('Vote failed')).toBeInTheDocument()
    })
    
    expect(mockOnVoteComplete).not.toHaveBeenCalled()
  })

  it('disables options while voting', async () => {
    global.fetch = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }), 100))
    ) as jest.Mock

    render(<PollView poll={mockPoll} onVoteComplete={mockOnVoteComplete} />)
    
    const options = screen.getAllByRole('button')
    fireEvent.click(options[0])
    
    await waitFor(() => {
      expect(screen.getByText('Submitting your vote...')).toBeInTheDocument()
    })
    
    options.forEach(option => {
      expect(option).toBeDisabled()
    })
  })

  it('highlights selected option', () => {
    render(<PollView poll={mockPoll} onVoteComplete={mockOnVoteComplete} />)
    
    const greenOption = screen.getByText('Green')
    fireEvent.click(greenOption)
    
    const button = greenOption.closest('button')
    expect(button).toHaveClass('border-blue-500', 'bg-blue-50')
  })
})
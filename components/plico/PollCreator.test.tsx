import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PollCreator from './PollCreator'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

const mockPush = jest.fn()
const mockRouter = { push: mockPush }

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter)
  mockPush.mockClear()
})

describe('PollCreator', () => {
  it('renders the poll creation form', () => {
    render(<PollCreator />)
    
    expect(screen.getByLabelText('Poll Question')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Create Poll')).toBeInTheDocument()
  })

  it('enforces character limits', () => {
    render(<PollCreator />)
    
    const questionInput = screen.getByLabelText('Poll Question')
    const longText = 'a'.repeat(300)
    
    fireEvent.change(questionInput, { target: { value: longText } })
    
    expect(questionInput).toHaveValue('a'.repeat(280))
  })

  it('allows adding options up to maximum', () => {
    render(<PollCreator />)
    
    const addButton = screen.getByText('+ Add Option')
    
    fireEvent.click(addButton)
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument()
    
    fireEvent.click(addButton)
    expect(screen.getByPlaceholderText('Option 4')).toBeInTheDocument()
    
    expect(screen.queryByText('+ Add Option')).not.toBeInTheDocument()
  })

  it('allows removing options but keeps minimum of 2', () => {
    render(<PollCreator />)
    
    fireEvent.click(screen.getByText('+ Add Option'))
    
    const removeButtons = screen.getAllByText('✕')
    expect(removeButtons).toHaveLength(3)
    
    fireEvent.click(removeButtons[2])
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument()
  })

  it('validates form before submission', async () => {
    render(<PollCreator />)
    
    const submitButton = screen.getByText('Create Poll')
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('creates poll successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'test-poll-123' })
      })
    ) as jest.Mock

    render(<PollCreator />)
    
    fireEvent.change(screen.getByLabelText('Poll Question'), {
      target: { value: 'Test question?' }
    })
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Option A' }
    })
    fireEvent.change(screen.getByPlaceholderText('Option 2'), {
      target: { value: 'Option B' }
    })
    
    fireEvent.click(screen.getByText('Create Poll'))
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/poll/test-poll-123')
    })
  })

  it('displays error on failed submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create poll' })
      })
    ) as jest.Mock

    render(<PollCreator />)
    
    fireEvent.change(screen.getByLabelText('Poll Question'), {
      target: { value: 'Test question?' }
    })
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'Option A' }
    })
    fireEvent.change(screen.getByPlaceholderText('Option 2'), {
      target: { value: 'Option B' }
    })
    
    fireEvent.click(screen.getByText('Create Poll'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create poll')).toBeInTheDocument()
    })
  })
})
export interface Plico {
  id: string
  question: string
  options: Option[]
  createdAt: Date
  updatedAt: Date
}

export interface Option {
  id: string
  text: string
  voteCount: number
  plicoId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlicoRequest {
  question: string
  options: string[]
}

export interface VoteRequest {
  optionId: string
}

export interface PlicoWithResults extends Plico {
  totalVotes: number
  winner?: Option
  isTie: boolean
}
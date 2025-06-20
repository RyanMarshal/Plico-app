export interface Plico {
  id: string;
  question: string;
  options: Option[];
  creatorId: string | null;
  finalized: boolean;
  finalizedAt: Date | null;
  closesAt: Date | null;
  tieBreakWinnerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Option {
  id: string;
  text: string;
  voteCount: number;
  plicoId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlicoRequest {
  question: string;
  options: string[];
  duration?: number; // duration in minutes, undefined means no timer
}

export interface VoteRequest {
  optionId: string;
}

export interface PlicoWithResults extends Plico {
  totalVotes: number;
  winner?: Option;
  isTie: boolean;
  isClosed: boolean; // true if closesAt has passed or finalized is true
  isCreator?: boolean; // true if the current user is the poll creator
}

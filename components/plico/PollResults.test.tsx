import { render, screen, waitFor } from "@testing-library/react";
import ResultsView from "./ResultsView";

const mockPoll = {
  id: "test-poll-123",
  question: "What is your favorite programming language?",
  options: [
    {
      id: "opt-1",
      text: "JavaScript",
      voteCount: 10,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "opt-2",
      text: "Python",
      voteCount: 15,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "opt-3",
      text: "TypeScript",
      voteCount: 5,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  totalVotes: 30,
  winner: {
    id: "opt-2",
    text: "Python",
    voteCount: 15,
    plicoId: "test-poll-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isTie: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTiePoll = {
  ...mockPoll,
  options: [
    {
      id: "opt-1",
      text: "JavaScript",
      voteCount: 10,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "opt-2",
      text: "Python",
      voteCount: 10,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "opt-3",
      text: "TypeScript",
      voteCount: 5,
      plicoId: "test-poll-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  totalVotes: 25,
  winner: {
    id: "opt-1",
    text: "JavaScript",
    voteCount: 10,
    plicoId: "test-poll-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isTie: true,
};

describe("ResultsView", () => {
  it("displays the poll question", () => {
    render(<ResultsView poll={mockPoll} />);

    expect(
      screen.getByText("What is your favorite programming language?"),
    ).toBeInTheDocument();
  });

  it("displays all options with vote counts", () => {
    render(<ResultsView poll={mockPoll} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("shows total votes", () => {
    render(<ResultsView poll={mockPoll} />);

    expect(screen.getByText("Total votes: 30")).toBeInTheDocument();
  });

  it("marks the winner", async () => {
    render(<ResultsView poll={mockPoll} />);

    await waitFor(
      () => {
        const winnerElements = screen.getAllByText("Winner!");
        expect(winnerElements).toHaveLength(1);
      },
      { timeout: 2000 },
    );
  });

  it("calculates percentages correctly", async () => {
    render(<ResultsView poll={mockPoll} />);

    await waitFor(
      () => {
        expect(screen.getByText("33.3%")).toBeInTheDocument();
        expect(screen.getByText("50.0%")).toBeInTheDocument();
        expect(screen.getByText("16.7%")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("shows tie breaker message for tied polls", async () => {
    render(<ResultsView poll={mockTiePoll} />);

    await waitFor(
      () => {
        expect(screen.getByText("It's a tie! 🎲")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        expect(screen.queryByText("It's a tie! 🎲")).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("animates vote bars", async () => {
    const { container } = render(<ResultsView poll={mockPoll} />);

    const bars = container.querySelectorAll(".bg-blue-500, .bg-green-500");

    expect(bars.length).toBeGreaterThan(0);

    bars.forEach((bar) => {
      expect(bar).toHaveStyle("transition: all");
    });
  });

  it("handles polls with no votes", () => {
    const noVotesPoll = {
      ...mockPoll,
      options: mockPoll.options.map((opt) => ({ ...opt, voteCount: 0 })),
      totalVotes: 0,
      winner: undefined,
    };

    render(<ResultsView poll={noVotesPoll} />);

    expect(screen.getByText("Total votes: 0")).toBeInTheDocument();
  });
});

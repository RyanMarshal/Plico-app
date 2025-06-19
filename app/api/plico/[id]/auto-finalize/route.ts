import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Dynamic import to avoid build-time evaluation
  const { db } = await import("@/lib/db");

  try {
    // Find the poll
    const poll = await db.plico.findUnique({
      where: { id: params.id },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if poll should be auto-finalized
    if (!poll.closesAt || poll.finalized) {
      return NextResponse.json(
        { error: "Poll does not need auto-finalization" },
        { status: 400 },
      );
    }

    // Check if timer has expired
    const now = new Date();
    if (poll.closesAt > now) {
      return NextResponse.json(
        { error: "Poll timer has not expired yet" },
        { status: 400 },
      );
    }

    // Check for ties
    const maxVotes = Math.max(...poll.options.map((opt) => opt.voteCount));
    const winners = poll.options.filter(
      (opt) => opt.voteCount === maxVotes && opt.voteCount > 0,
    );

    let tieBreakWinnerId = undefined;
    if (winners.length > 1) {
      // Multiple winners - use deterministic selection based on poll ID
      // This ensures all users see the same winner
      const sortedWinners = winners.sort((a, b) => a.id.localeCompare(b.id));
      const seed = poll.id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const selectedIndex = seed % sortedWinners.length;
      tieBreakWinnerId = sortedWinners[selectedIndex].id;
    }

    // Update poll to finalized
    const updatedPoll = await db.plico.update({
      where: { id: params.id },
      data: {
        finalized: true,
        finalizedAt: new Date(),
        tieBreakWinnerId: tieBreakWinnerId,
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json(updatedPoll);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to auto-finalize poll" },
      { status: 500 },
    );
  }
}

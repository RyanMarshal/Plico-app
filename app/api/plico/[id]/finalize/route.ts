import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Dynamic import to avoid build-time evaluation
  const { db } = await import("@/lib/db");
  try {
    const body = await request.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID is required" },
        { status: 401 },
      );
    }

    // Find the poll and verify creator
    const poll = await db.plico.findUnique({
      where: { id: params.id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // For old polls without creatorId, allow any user to finalize
    if (poll.creatorId && poll.creatorId !== creatorId) {
      return NextResponse.json(
        { error: "Only the poll creator can finalize results" },
        { status: 403 },
      );
    }

    if (poll.finalized) {
      // Return the already finalized poll (idempotent)
      const finalizedPoll = await db.plico.findUnique({
        where: { id: params.id },
        include: { options: true },
      });
      return NextResponse.json(finalizedPoll);
    }

    // Get the poll with options to check for ties
    const pollWithOptions = await db.plico.findUnique({
      where: { id: params.id },
      include: { options: true },
    });

    if (!pollWithOptions) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check for ties
    const maxVotes = Math.max(
      ...pollWithOptions.options.map((opt) => opt.voteCount),
    );
    const winners = pollWithOptions.options.filter(
      (opt) => opt.voteCount === maxVotes && opt.voteCount > 0,
    );

    let tieBreakWinnerId = undefined;
    if (winners.length > 1) {
      // Multiple winners - select one randomly for tie-breaker
      const randomIndex = Math.floor(Math.random() * winners.length);
      tieBreakWinnerId = winners[randomIndex].id;
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
      { error: "Failed to finalize poll" },
      { status: 500 },
    );
  }
}

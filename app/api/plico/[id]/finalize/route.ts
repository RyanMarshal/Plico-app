import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Dynamic import to avoid build-time evaluation
  const { db } = await import("@/lib/db");
  try {
    // Get admin cookie for this poll
    const adminCookie = request.cookies.get(`plico_admin_${params.id}`);
    
    if (!adminCookie) {
      return NextResponse.json(
        { error: "Only the poll creator can finalize results" },
        { status: 403 },
      );
    }

    // Find the poll and verify admin key
    const poll = await db.plico.findUnique({
      where: { id: params.id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Verify the admin key matches the hashed version
    if (!poll.creatorId || !(await bcrypt.compare(adminCookie.value, poll.creatorId))) {
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
      // Multiple winners - use deterministic selection based on poll ID
      const sortedWinners = winners.sort((a, b) => a.id.localeCompare(b.id));
      const seed = poll.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
      { error: "Failed to finalize poll" },
      { status: 500 },
    );
  }
}
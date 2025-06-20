import { NextRequest, NextResponse } from "next/server";
import { PlicoWithResults } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { db } = await import("@/lib/db");
  try {
    // Check if user has admin cookie for this poll
    const adminCookie = request.cookies.get(`plico_admin_${params.id}`);
    const isAdmin = !!adminCookie;
    const plico = await db.plico.findUnique({
      where: { id: params.id },
      include: {
        options: {
          orderBy: [
            { createdAt: "asc" },
            { id: "asc" }, // Secondary sort by ID to ensure consistent ordering
          ],
        },
      },
    });

    if (!plico) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const totalVotes = plico.options.reduce(
      (sum, opt) => sum + opt.voteCount,
      0,
    );

    const maxVotes = Math.max(...plico.options.map((opt) => opt.voteCount));
    const winners = plico.options.filter(
      (opt) => opt.voteCount === maxVotes && opt.voteCount > 0,
    );

    let winner = winners.length === 1 ? winners[0] : undefined;
    const isTie = winners.length > 1;

    // Check if poll is closed (either by timer or finalization)
    const now = new Date();
    const isClosed =
      plico.finalized || (plico.closesAt !== null && plico.closesAt <= now);

    // For tie-breakers in closed polls
    if (isTie && isClosed) {
      if (plico.tieBreakWinnerId) {
        // Use stored tie-breaker winner for finalized polls
        winner = plico.options.find((opt) => opt.id === plico.tieBreakWinnerId);
      } else {
        // For timer-expired polls without stored winner, use deterministic selection
        // This ensures all users see the same winner
        const sortedWinners = winners.sort((a, b) => a.id.localeCompare(b.id));
        // Use poll ID as seed for consistent selection
        const seed = plico.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const selectedIndex = seed % sortedWinners.length;
        winner = sortedWinners[selectedIndex];
      }
    }

    // Verify admin status if cookie is present
    let verifiedAdmin = false;
    if (adminCookie && plico.creatorId) {
      verifiedAdmin = adminCookie.value === plico.creatorId;
    }

    // Remove sensitive fields from the response
    const { creatorId: _, ...plicoWithoutCreatorId } = plico;
    
    const result: PlicoWithResults = {
      ...plicoWithoutCreatorId,
      creatorId: null, // Hide the actual creatorId
      totalVotes,
      winner,
      isTie,
      isClosed,
      isCreator: verifiedAdmin, // Add creator status to response
    };

    // Add cache headers for better performance
    const headers = new Headers();
    // Cache for 5 seconds for active polls, 1 minute for closed polls
    const cacheTime = isClosed ? 60 : 5;
    headers.set(
      "Cache-Control",
      `public, s-maxage=${cacheTime}, stale-while-revalidate`,
    );

    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 },
    );
  }
}

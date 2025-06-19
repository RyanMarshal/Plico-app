import { NextRequest, NextResponse } from "next/server";
import { VoteRequest } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { db } = await import("@/lib/db");
  try {
    const body: VoteRequest = await request.json();

    if (!body.optionId) {
      return NextResponse.json(
        { error: "Option ID is required" },
        { status: 400 },
      );
    }

    // First, check if the poll exists and is still open
    const poll = await db.plico.findUnique({
      where: { id: params.id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if poll is closed
    const now = new Date();
    if (poll.finalized || (poll.closesAt !== null && poll.closesAt <= now)) {
      return NextResponse.json(
        { error: "Voting has ended for this poll" },
        { status: 400 },
      );
    }

    const option = await db.option.findFirst({
      where: {
        id: body.optionId,
        plicoId: params.id,
      },
    });

    if (!option) {
      return NextResponse.json(
        { error: "Invalid option for this poll" },
        { status: 404 },
      );
    }

    const updatedOption = await db.option.update({
      where: { id: body.optionId },
      data: {
        voteCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      voteCount: updatedOption.voteCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 },
    );
  }
}

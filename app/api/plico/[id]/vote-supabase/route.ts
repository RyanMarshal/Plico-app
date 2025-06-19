import { NextRequest, NextResponse } from "next/server";
import { VoteRequest } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log("Vote API called with params:", params);

    const supabase = createSupabaseServerClient();
    const body: VoteRequest = await request.json();

    console.log("Vote request body:", body);

    if (!body.optionId) {
      return NextResponse.json(
        { error: "Option ID is required" },
        { status: 400 },
      );
    }

    // First, check if the poll exists and is still open
    const { data: poll, error: pollError } = await supabase
      .from("Plico")
      .select("*")
      .eq("id", params.id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if poll is closed
    const now = new Date();
    if (poll.finalized || (poll.closesAt && new Date(poll.closesAt) <= now)) {
      return NextResponse.json(
        { error: "Voting has ended for this poll" },
        { status: 400 },
      );
    }

    // Verify the option belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from("Option")
      .select("*")
      .eq("id", body.optionId)
      .eq("plicoId", params.id)
      .single();

    if (optionError || !option) {
      return NextResponse.json(
        { error: "Invalid option for this poll" },
        { status: 404 },
      );
    }

    // Update the vote count using Supabase
    // This will trigger real-time events
    const { data: updatedOption, error: updateError } = await supabase
      .from("Option")
      .update({
        voteCount: option.voteCount + 1,
      })
      .eq("id", body.optionId)
      .select()
      .single();

    if (updateError) {
      console.error("Vote update error:", updateError);
      return NextResponse.json(
        { error: "Failed to record vote" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      voteCount: updatedOption.voteCount,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      {
        error: "Failed to record vote",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

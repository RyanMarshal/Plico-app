import { NextRequest, NextResponse } from "next/server";
import { VoteRequest } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { db } = await import("@/lib/db");

  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    const rateLimitKey = `vote:${params.id}:${clientIp}`;
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, 5, 60 * 1000); // 5 votes per minute per IP per poll
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Too many votes. Please try again later.",
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000))
          }
        },
      );
    }

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

    // Update using Prisma (for data integrity)
    const updatedOption = await db.option.update({
      where: { id: body.optionId },
      data: {
        voteCount: {
          increment: 1,
        },
      },
    });

    // After successful Prisma update, trigger Supabase real-time manually
    try {
      const supabase = createSupabaseServerClient();

      // Manually update via Supabase to trigger real-time
      // We're just touching the record to trigger the event
      await supabase
        .from("Option")
        .update({
          voteCount: updatedOption.voteCount,
        })
        .eq("id", body.optionId);

      // Real-time trigger sent successfully
    } catch (realtimeError) {
      // Log but don't fail the request if real-time trigger fails
      console.error("Failed to trigger real-time update:", realtimeError);
    }

    return NextResponse.json({
      success: true,
      voteCount: updatedOption.voteCount,
    }, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': new Date(resetAt).toISOString()
      }
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 },
    );
  }
}
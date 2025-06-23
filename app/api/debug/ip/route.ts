import { NextRequest, NextResponse } from "next/server";
import { debugClientIp } from "@/lib/rate-limiter-debug";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 404 },
    );
  }

  const debugInfo = debugClientIp(request);

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    platform: process.env.VERCEL ? "Vercel" : "Other",
    ...debugInfo,
  });
}

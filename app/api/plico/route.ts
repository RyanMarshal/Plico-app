import { NextRequest, NextResponse } from "next/server";
import { CreatePlicoRequest } from "@/lib/types";
import { createPollSchema } from "@/lib/validations";
import { z } from "zod";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { db } = await import("@/lib/db");
  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = createPollSchema.parse(body);

    // Additional validation for empty strings after trimming
    const invalidOption = validatedData.options.find(
      (opt) => opt.trim().length === 0,
    );
    if (invalidOption) {
      return NextResponse.json(
        { error: "Options cannot be empty" },
        { status: 400 },
      );
    }

    // Calculate closesAt if duration is provided
    let closesAt = undefined;
    if (validatedData.duration && validatedData.duration > 0) {
      closesAt = new Date();
      closesAt.setMinutes(closesAt.getMinutes() + validatedData.duration);
    }

    // Generate a secure admin key (shorter for Safari compatibility)
    const adminKey = randomBytes(16).toString('hex');
    
    // Hash the admin key before storing
    const hashedAdminKey = await bcrypt.hash(adminKey, 10);

    const plico = await db.plico.create({
      data: {
        question: validatedData.question,
        creatorId: hashedAdminKey, // Store hashed version
        closesAt,
        options: {
          create: validatedData.options.map((text, index) => ({
            text,
            // Ensure consistent ordering by adding a small time offset
            createdAt: new Date(Date.now() + index),
          })),
        },
      },
      include: {
        options: true,
      },
    });

    // Create response with poll data (hiding the creatorId which now contains admin key)
    const publicPoll = {
      ...plico,
      creatorId: null // Hide the admin key
    };
    
    // Create response and set admin key in a secure HTTP-only cookie
    const response = NextResponse.json(publicPoll, { status: 201 });
    
    // Set admin key as a secure cookie for this specific poll
    response.cookies.set(`plico_admin_${plico.id}`, adminKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days (reduced for Safari)
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error("Error creating poll:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Failed to create plico";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

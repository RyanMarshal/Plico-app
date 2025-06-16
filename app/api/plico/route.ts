import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CreatePlicoRequest } from '@/lib/types'
import { createPollSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input with Zod
    const validatedData = createPollSchema.parse(body)
    
    // Additional validation for empty strings after trimming
    const invalidOption = validatedData.options.find(opt => opt.trim().length === 0)
    if (invalidOption) {
      return NextResponse.json(
        { error: 'Options cannot be empty' },
        { status: 400 }
      )
    }

    // Calculate closesAt if duration is provided
    let closesAt = undefined
    if (validatedData.duration && validatedData.duration > 0) {
      closesAt = new Date()
      closesAt.setMinutes(closesAt.getMinutes() + validatedData.duration)
    }

    const plico = await db.plico.create({
      data: {
        question: validatedData.question,
        closesAt,
        options: {
          create: validatedData.options.map((text, index) => ({ 
            text,
            // Ensure consistent ordering by adding a small time offset
            createdAt: new Date(Date.now() + index)
          }))
        }
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(plico, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating plico:', error)
    return NextResponse.json(
      { error: 'Failed to create plico' },
      { status: 500 }
    )
  }
}
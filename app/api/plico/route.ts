import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CreatePlicoRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlicoRequest = await request.json()
    
    if (!body.question || !body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: 'Question and at least 2 options are required' },
        { status: 400 }
      )
    }

    if (body.question.length > 280) {
      return NextResponse.json(
        { error: 'Question must be 280 characters or less' },
        { status: 400 }
      )
    }

    if (body.options.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 options allowed' },
        { status: 400 }
      )
    }

    const invalidOption = body.options.find(opt => opt.length > 80)
    if (invalidOption) {
      return NextResponse.json(
        { error: 'Each option must be 80 characters or less' },
        { status: 400 }
      )
    }

    // Calculate closesAt if duration is provided
    let closesAt = undefined
    if (body.duration && body.duration > 0) {
      closesAt = new Date()
      closesAt.setMinutes(closesAt.getMinutes() + body.duration)
    }

    const plico = await db.plico.create({
      data: {
        question: body.question,
        closesAt,
        options: {
          create: body.options.map(text => ({ text }))
        }
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(plico, { status: 201 })
  } catch (error) {
    console.error('Error creating plico:', error)
    return NextResponse.json(
      { error: 'Failed to create plico' },
      { status: 500 }
    )
  }
}
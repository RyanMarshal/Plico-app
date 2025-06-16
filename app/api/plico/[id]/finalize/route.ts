import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { creatorId } = body

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 401 }
      )
    }

    // Find the poll and verify creator
    const poll = await db.plico.findUnique({
      where: { id: params.id }
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // For old polls without creatorId, allow any user to finalize
    if (poll.creatorId && poll.creatorId !== creatorId) {
      return NextResponse.json(
        { error: 'Only the poll creator can finalize results' },
        { status: 403 }
      )
    }

    if (poll.finalized) {
      return NextResponse.json(
        { error: 'Poll already finalized' },
        { status: 400 }
      )
    }

    // Update poll to finalized
    const updatedPoll = await db.plico.update({
      where: { id: params.id },
      data: {
        finalized: true,
        finalizedAt: new Date()
      },
      include: {
        options: true
      }
    })

    return NextResponse.json(updatedPoll)
  } catch (error) {
    console.error('Error finalizing poll:', error)
    return NextResponse.json(
      { error: 'Failed to finalize poll' },
      { status: 500 }
    )
  }
}
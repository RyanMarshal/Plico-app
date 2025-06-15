import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { VoteRequest } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: VoteRequest = await request.json()
    
    if (!body.optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }

    const option = await db.option.findFirst({
      where: {
        id: body.optionId,
        plicoId: params.id
      }
    })

    if (!option) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 404 }
      )
    }

    const updatedOption = await db.option.update({
      where: { id: body.optionId },
      data: {
        voteCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      voteCount: updatedOption.voteCount 
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
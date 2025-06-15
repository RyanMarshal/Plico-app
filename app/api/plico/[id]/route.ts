import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PlicoWithResults } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plico = await db.plico.findUnique({
      where: { id: params.id },
      include: {
        options: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!plico) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    const totalVotes = plico.options.reduce((sum, opt) => sum + opt.voteCount, 0)
    
    const maxVotes = Math.max(...plico.options.map(opt => opt.voteCount))
    const winners = plico.options.filter(opt => opt.voteCount === maxVotes && opt.voteCount > 0)
    
    let winner = winners.length === 1 ? winners[0] : undefined
    const isTie = winners.length > 1
    
    if (isTie) {
      const randomIndex = Math.floor(Math.random() * winners.length)
      winner = winners[randomIndex]
    }

    const result: PlicoWithResults = {
      ...plico,
      totalVotes,
      winner,
      isTie
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching plico:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}
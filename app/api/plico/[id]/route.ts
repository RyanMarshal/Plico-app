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
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' }  // Secondary sort by ID to ensure consistent ordering
          ]
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

    // Check if poll is closed (either by timer or finalization)
    const now = new Date()
    const isClosed = plico.finalized || (plico.closesAt !== null && plico.closesAt <= now)

    const result: PlicoWithResults = {
      ...plico,
      totalVotes,
      winner,
      isTie,
      isClosed
    }

    // Add cache headers for better performance
    const headers = new Headers()
    // Cache for 5 seconds for active polls, 1 minute for closed polls
    const cacheTime = isClosed ? 60 : 5
    headers.set('Cache-Control', `public, s-maxage=${cacheTime}, stale-while-revalidate`)
    
    return NextResponse.json(result, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}
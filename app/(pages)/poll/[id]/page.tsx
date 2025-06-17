import { Metadata } from 'next'
import PollPageClient from './poll-client'

// Get base URL for OpenGraph image generation
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const pollId = params.id
  
  try {
    // Import db dynamically to avoid build-time evaluation
    const { db } = await import('@/lib/db')
    
    // Fetch the poll data from the database
    const poll = await db.plico.findUnique({ 
      where: { id: pollId },
      select: {
        question: true,
        options: {
          select: { text: true }
        }
      }
    })

    if (!poll) {
      return { 
        title: 'Plico - Quick Polls',
        description: 'Create and share polls instantly'
      }
    }

    const question = poll.question
    const optionsText = poll.options.map(opt => opt.text).join(' • ')
    const description = `Vote now: ${optionsText} - Tap to make your choice instantly!`

    // Construct the URL for our dynamic image generator
    const baseUrl = getBaseUrl()
    const ogImageUrl = new URL(`${baseUrl}/api/og`)
    ogImageUrl.searchParams.set('question', question)

    return {
      title: `${question} - Plico`,
      description: description,
      openGraph: {
        title: question,
        description: description,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: `Plico poll: ${question}`,
          },
        ],
        siteName: 'Plico',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: question,
        description: description,
        images: [ogImageUrl.toString()],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return { 
      title: 'Plico - Quick Polls',
      description: 'Create and share polls instantly'
    }
  }
}

export default function PollPage({ params }: { params: { id: string } }) {
  return <PollPageClient />
}
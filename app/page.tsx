import type { Metadata } from 'next'
import HomePage from './(pages)/page'

export const metadata: Metadata = {
  title: 'Plico: Stop arguing. Send a Plico.',
  description: 'The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.',
  openGraph: {
    title: 'Plico: Stop arguing. Send a Plico.',
    description: 'The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.',
    type: 'website',
    images: [
      {
        url: '/api/og?question=' + encodeURIComponent('Stop arguing. Send a Plico.'),
        width: 1200,
        height: 630,
        alt: 'Plico - Quick Polls',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plico: Stop arguing. Send a Plico.',
    description: 'The fastest, most fun way to make a group decision. Create a dead-simple poll in seconds and get a final answer, finally.',
    images: ['/api/og?question=' + encodeURIComponent('Stop arguing. Send a Plico.')],
  },
}

export default function Page() {
  return <HomePage />
}
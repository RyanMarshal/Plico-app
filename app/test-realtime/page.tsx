'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestRealtime() {
  const [status, setStatus] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    setStatus(prev => [...prev, 'Creating Supabase client...'])

    const channel = supabase
      .channel('test-channel')
      .on('presence', { event: 'sync' }, () => {
        setStatus(prev => [...prev, 'Presence sync event received'])
      })
      .subscribe((status, error) => {
        setStatus(prev => [...prev, `Subscription status: ${status}`])
        if (error) {
          setStatus(prev => [...prev, `Error: ${JSON.stringify(error)}`])
        }
      })

    // Test if we can connect at all
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('Option')
          .select('id')
          .limit(1)
        
        if (error) {
          setStatus(prev => [...prev, `Database query error: ${error.message}`])
        } else {
          setStatus(prev => [...prev, `Database connection OK: Found ${data?.length || 0} records`])
        }
      } catch (err) {
        setStatus(prev => [...prev, `Database connection failed: ${err}`])
      }
    }

    testConnection()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Realtime Test</h1>
      <div className="space-y-2">
        {status.map((msg, idx) => (
          <div key={idx} className="font-mono text-sm">
            {msg}
          </div>
        ))}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export default function TestWebSocketFixed() {
  const [connectionState, setConnectionState] = useState<string>('Disconnected')
  const [events, setEvents] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      setError(null)
      setConnectionState('Connecting...')
      
      const supabase = createSupabaseBrowserClient()
      
      // Clean up any existing channel
      if (channel) {
        await channel.unsubscribe()
      }

      // Create a new channel with a unique name
      const newChannel = supabase
        .channel(`poll-updates-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Option'
          },
          (payload) => {
            console.log('Change received:', payload)
            setEvents(prev => [...prev, {
              timestamp: new Date().toISOString(),
              type: 'postgres_change',
              payload
            }])
          }
        )
        .on('system', { event: '*' }, (payload) => {
          console.log('System event:', payload)
          setEvents(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: 'system',
            payload
          }])
        })
        .subscribe((status) => {
          console.log('Subscription status:', status)
          setConnectionState(status)
          
          if (status === 'SUBSCRIBED') {
            setEvents(prev => [...prev, {
              timestamp: new Date().toISOString(),
              type: 'status',
              payload: { message: 'Successfully subscribed to realtime changes' }
            }])
          } else if (status === 'CHANNEL_ERROR') {
            setError('Channel error occurred')
          } else if (status === 'TIMED_OUT') {
            setError('Connection timed out')
          }
        })

      setChannel(newChannel)
    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setConnectionState('Error')
    }
  }

  const disconnect = async () => {
    if (channel) {
      await channel.unsubscribe()
      setChannel(null)
      setConnectionState('Disconnected')
      setEvents(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: 'status',
        payload: { message: 'Disconnected from realtime' }
      }])
    }
  }

  const testUpdate = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      
      // Get a random option to update
      const { data: options, error: fetchError } = await supabase
        .from('Option')
        .select('*')
        .limit(1)
      
      if (fetchError) {
        setError(`Failed to fetch options: ${fetchError.message}`)
        return
      }

      if (!options || options.length === 0) {
        setError('No options found to update')
        return
      }

      const option = options[0]
      
      // Update the vote count
      const { error: updateError } = await supabase
        .from('Option')
        .update({ voteCount: option.voteCount + 1 })
        .eq('id', option.id)
      
      if (updateError) {
        setError(`Failed to update option: ${updateError.message}`)
        return
      }

      setEvents(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: 'action',
        payload: { message: `Updated option ${option.id} vote count to ${option.voteCount + 1}` }
      }])
    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [channel])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test (Fixed)</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-lg">
          Connection State: 
          <span className={`ml-2 font-semibold ${
            connectionState === 'SUBSCRIBED' ? 'text-green-600' :
            connectionState === 'Error' ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {connectionState}
          </span>
        </p>
        {error && (
          <p className="mt-2 text-red-600">Error: {error}</p>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={connect}
          disabled={connectionState === 'SUBSCRIBED' || connectionState === 'Connecting...'}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
        >
          Connect
        </button>
        
        <button
          onClick={disconnect}
          disabled={connectionState !== 'SUBSCRIBED'}
          className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:bg-gray-400"
        >
          Disconnect
        </button>

        <button
          onClick={testUpdate}
          disabled={connectionState !== 'SUBSCRIBED'}
          className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-gray-400"
        >
          Test Update
        </button>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Events Log</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-gray-500">No events yet. Connect to start receiving events.</p>
          ) : (
            events.map((event, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-gray-500">{event.timestamp}</span>
                </div>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">How this works:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Connect" to establish a WebSocket connection</li>
          <li>The connection subscribes to changes on the Option table</li>
          <li>Click "Test Update" to modify a record and trigger a realtime event</li>
          <li>Watch the events log to see realtime updates</li>
        </ol>
      </div>
    </div>
  )
}
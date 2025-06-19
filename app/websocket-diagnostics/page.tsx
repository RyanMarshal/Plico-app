'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface DiagnosticResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export default function WebSocketDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const addResult = useCallback((result: DiagnosticResult) => {
    setResults(prev => [...prev, result])
  }, [])

  const updateResult = useCallback((test: string, update: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map(r => r.test === test ? { ...r, ...update } : r))
  }, [])

  const runDiagnostics = async () => {
    setResults([])
    setIsRunning(true)

    // Test 1: Check Environment Variables
    addResult({
      test: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment variables...'
    })

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    updateResult('Environment Variables', {
      status: hasUrl && hasKey ? 'success' : 'error',
      message: hasUrl && hasKey ? 'Environment variables are set' : 'Missing environment variables',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: hasUrl ? 'Set' : 'Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasKey ? 'Set' : 'Missing'
      }
    })

    if (!hasUrl || !hasKey) {
      setIsRunning(false)
      return
    }

    // Test 2: Create Supabase Client
    addResult({
      test: 'Supabase Client',
      status: 'pending',
      message: 'Creating Supabase client...'
    })

    let supabase
    try {
      supabase = createSupabaseBrowserClient()
      updateResult('Supabase Client', {
        status: 'success',
        message: 'Supabase client created successfully'
      })
    } catch (error) {
      updateResult('Supabase Client', {
        status: 'error',
        message: 'Failed to create Supabase client',
        details: error
      })
      setIsRunning(false)
      return
    }

    // Test 3: Check Authentication Status
    addResult({
      test: 'Authentication Check',
      status: 'pending',
      message: 'Checking authentication status...'
    })

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      updateResult('Authentication Check', {
        status: error ? 'error' : 'success',
        message: error ? `Auth error: ${error.message}` : `Auth status: ${session ? 'Authenticated' : 'Anonymous'}`,
        details: { session: session ? 'Present' : 'None', error }
      })
    } catch (error) {
      updateResult('Authentication Check', {
        status: 'error',
        message: 'Failed to check authentication',
        details: error
      })
    }

    // Test 4: Database Query
    addResult({
      test: 'Database Query',
      status: 'pending',
      message: 'Testing database connection...'
    })

    try {
      const { data, error } = await supabase
        .from('Plico')
        .select('id')
        .limit(1)

      updateResult('Database Query', {
        status: error ? 'error' : 'success',
        message: error ? `Database error: ${error.message}` : 'Database query successful',
        details: { rowCount: data?.length || 0, error }
      })
    } catch (error) {
      updateResult('Database Query', {
        status: 'error',
        message: 'Failed to query database',
        details: error
      })
    }

    // Test 5: WebSocket Connection
    addResult({
      test: 'WebSocket Connection',
      status: 'pending',
      message: 'Establishing WebSocket connection...'
    })

    try {
      const testChannel = supabase.channel('diagnostics-test')
      
      let connectionTimeout = setTimeout(() => {
        updateResult('WebSocket Connection', {
          status: 'error',
          message: 'WebSocket connection timeout',
          details: { state: testChannel.state }
        })
      }, 10000)

      testChannel
        .on('system', { event: '*' }, (payload) => {
          console.log('System event:', payload)
        })
        .subscribe((status) => {
          clearTimeout(connectionTimeout)
          
          if (status === 'SUBSCRIBED') {
            updateResult('WebSocket Connection', {
              status: 'success',
              message: 'WebSocket connected successfully',
              details: { state: testChannel.state, status }
            })
            
            // Continue with realtime test
            testRealtimeSubscription(supabase, testChannel)
          } else if (status === 'CHANNEL_ERROR') {
            updateResult('WebSocket Connection', {
              status: 'error',
              message: 'WebSocket channel error',
              details: { state: testChannel.state, status }
            })
          } else if (status === 'TIMED_OUT') {
            updateResult('WebSocket Connection', {
              status: 'error',
              message: 'WebSocket connection timed out',
              details: { state: testChannel.state, status }
            })
          }
        })

      setChannel(testChannel)
    } catch (error) {
      updateResult('WebSocket Connection', {
        status: 'error',
        message: 'Failed to create WebSocket connection',
        details: error
      })
    }
  }

  const testRealtimeSubscription = async (supabase: any, existingChannel: RealtimeChannel) => {
    // Test 6: Realtime Subscription
    addResult({
      test: 'Realtime Subscription',
      status: 'pending',
      message: 'Testing realtime subscription...'
    })

    try {
      // First unsubscribe from the test channel
      await existingChannel.unsubscribe()

      // Create a new channel for realtime testing
      const realtimeChannel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Option'
          },
          (payload: any) => {
            console.log('Realtime event received:', payload)
            updateResult('Realtime Subscription', {
              status: 'success',
              message: 'Realtime event received!',
              details: payload
            })
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            updateResult('Realtime Subscription', {
              status: 'success',
              message: 'Realtime subscription active',
              details: { status }
            })
          }
        })

      setChannel(realtimeChannel)

      // Test 7: Network Diagnostics
      setTimeout(() => {
        testNetworkDiagnostics()
      }, 2000)
    } catch (error) {
      updateResult('Realtime Subscription', {
        status: 'error',
        message: 'Failed to set up realtime subscription',
        details: error
      })
    }
  }

  const testNetworkDiagnostics = async () => {
    addResult({
      test: 'Network Diagnostics',
      status: 'pending',
      message: 'Running network diagnostics...'
    })

    const diagnostics = {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : 'Not available',
      timestamp: new Date().toISOString()
    }

    updateResult('Network Diagnostics', {
      status: 'success',
      message: 'Network diagnostics complete',
      details: diagnostics
    })

    setIsRunning(false)
  }

  const cleanup = () => {
    if (channel) {
      channel.unsubscribe()
      setChannel(null)
    }
  }

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">WebSocket Diagnostics</h1>
      
      <div className="mb-6">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
        
        {channel && (
          <button
            onClick={cleanup}
            className="ml-4 bg-red-500 text-white px-6 py-2 rounded-lg"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              result.status === 'success' ? 'border-green-500 bg-green-50' :
              result.status === 'error' ? 'border-red-500 bg-red-50' :
              'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{result.test}</h3>
              <span className={`text-sm font-medium ${
                result.status === 'success' ? 'text-green-600' :
                result.status === 'error' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{result.message}</p>
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600">
                  View Details
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">Common Issues & Solutions:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Check if you're behind a corporate firewall or VPN</li>
          <li>Disable browser extensions (especially ad blockers)</li>
          <li>Ensure your Supabase project is not paused</li>
          <li>Verify that realtime is enabled on your tables</li>
          <li>Check browser console for additional errors</li>
        </ul>
      </div>
    </div>
  )
}
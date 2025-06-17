'use client'

import { useSoundEffects } from '@/hooks/useSoundEffects'

export default function TestSounds() {
  const { playPop, playWhoosh, playChime, playRattle, playTick, playHeartbeat } = useSoundEffects()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sound Test</h1>
      <div className="space-y-2">
        <button onClick={playPop} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Pop
        </button>
        <button onClick={playWhoosh} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Whoosh
        </button>
        <button onClick={playChime} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Chime
        </button>
        <button onClick={playRattle} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Rattle
        </button>
        <button onClick={playTick} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Tick
        </button>
        <button onClick={playHeartbeat} className="px-4 py-2 bg-blue-500 text-white rounded">
          Play Heartbeat
        </button>
      </div>
    </div>
  )
}
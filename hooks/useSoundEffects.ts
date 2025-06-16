import { Howl } from 'howler'
import { useMemo, useCallback } from 'react'
import { useSoundContext } from '@/contexts/SoundContext'

// Define all our sounds with their settings
const soundDefinitions = {
  pop: { src: ['/sounds/pop.mp3'], volume: 0.7 },
  whoosh: { src: ['/sounds/whoosh.mp3'], volume: 0.8 },
  chime: { src: ['/sounds/chime.mp3'], volume: 0.9 },
  rattle: { src: ['/sounds/rattle.mp3'], volume: 0.6 },
  tick: { src: ['/sounds/tick.mp3'], volume: 0.5 },
  heartbeat: { src: ['/sounds/heartbeat.mp3'], volume: 0.4 }
}

export const useSoundEffects = () => {
  const { isMuted } = useSoundContext()

  // Preload all sounds
  const sounds = useMemo(() => {
    const loadedSounds: Record<string, Howl> = {}
    
    Object.entries(soundDefinitions).forEach(([key, definition]) => {
      loadedSounds[key] = new Howl({
        ...definition,
        preload: true,
        html5: true // Better performance on mobile
      })
    })
    
    return loadedSounds
  }, [])

  // Generic play function that respects mute state
  const playSound = useCallback((soundName: keyof typeof soundDefinitions) => {
    if (isMuted) return
    
    const sound = sounds[soundName]
    if (sound) {
      // Stop any currently playing instance and start fresh
      sound.stop()
      sound.play()
    }
  }, [isMuted, sounds])

  // Return specific play functions for each sound
  return {
    playPop: useCallback(() => playSound('pop'), [playSound]),
    playWhoosh: useCallback(() => playSound('whoosh'), [playSound]),
    playChime: useCallback(() => playSound('chime'), [playSound]),
    playRattle: useCallback(() => playSound('rattle'), [playSound]),
    playTick: useCallback(() => playSound('tick'), [playSound]),
    playHeartbeat: useCallback(() => playSound('heartbeat'), [playSound])
  }
}
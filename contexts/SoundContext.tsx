'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SoundContextType {
  isMuted: boolean
  toggleMute: () => void
}

const SoundContext = createContext<SoundContextType>({
  isMuted: false,
  toggleMute: () => {}
})

export const useSoundContext = () => {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSoundContext must be used within SoundProvider')
  }
  return context
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false)

  // Load mute preference from localStorage
  useEffect(() => {
    const savedMuteState = localStorage.getItem('plico-sound-muted')
    if (savedMuteState === 'true') {
      setIsMuted(true)
    }
  }, [])

  const toggleMute = () => {
    setIsMuted(prev => {
      const newState = !prev
      localStorage.setItem('plico-sound-muted', String(newState))
      return newState
    })
  }

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  )
}
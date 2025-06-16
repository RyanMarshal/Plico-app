'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'

interface WinnerSpotlightProps {
  winnerText: string
  isVisible: boolean
}

const WinnerSpotlight = memo(function WinnerSpotlight({ winnerText, isVisible }: WinnerSpotlightProps) {
  if (!isVisible) return null

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Spotlight beam effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-yellow-200/30 via-yellow-100/20 to-transparent"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      
      {/* Rotating light rays */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
            }}
          />
        ))}
      </motion.div>
      
      {/* Sparkles - reduced for performance */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{
            transform: `translate(${15 + (i % 2) * 70}%, ${20 + Math.floor(i / 2) * 60}%)`
          }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          ✨
        </motion.div>
      ))}
      
      {/* Pulsing glow border - using transform for better performance */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: "inset 0 0 30px rgba(250, 204, 21, 0.3)",
        }}
      />
    </motion.div>
  )
})

export default WinnerSpotlight
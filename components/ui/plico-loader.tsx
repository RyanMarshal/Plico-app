'use client'

import { motion } from 'framer-motion'

interface PlicoLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function PlicoLoader({ size = 'md', text }: PlicoLoaderProps) {
  const sizes = {
    sm: { box: 32, dot: 6 },
    md: { box: 48, dot: 8 },
    lg: { box: 64, dot: 10 }
  }

  const { box, dot } = sizes[size]

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: box, height: box }}>
        {/* Rotating container */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Orbiting dots */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * 90 * Math.PI) / 180
            const radius = box / 2 - dot / 2
            const x = radius * Math.cos(angle)
            const y = radius * Math.sin(angle)
            
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: dot,
                  height: dot,
                  left: box / 2 + x - dot / 2,
                  top: box / 2 + y - dot / 2,
                  background: `hsl(${270 + i * 30}, 70%, 50%)`
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            )
          })}
        </motion.div>
        
        {/* Center pulse */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{
            width: dot * 1.5,
            height: dot * 1.5,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {text && (
        <motion.p
          className="text-sm font-medium text-gray-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Alternative loader - morphing shapes
export function MorphLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 40,
    md: 60,
    lg: 80
  }

  const boxSize = sizes[size]

  return (
    <div className="relative" style={{ width: boxSize, height: boxSize }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        <motion.path
          d="M 25,50 Q 25,25 50,25 Q 75,25 75,50 Q 75,75 50,75 Q 25,75 25,50"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{
            d: [
              "M 25,50 Q 25,25 50,25 Q 75,25 75,50 Q 75,75 50,75 Q 25,75 25,50",
              "M 35,35 Q 35,35 50,20 Q 65,35 65,35 Q 65,65 50,80 Q 35,65 35,35",
              "M 20,50 Q 35,35 50,50 Q 65,65 80,50 Q 65,35 50,50 Q 35,65 20,50",
              "M 25,50 Q 25,25 50,25 Q 75,25 75,50 Q 75,75 50,75 Q 25,75 25,50"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6">
              <animate
                attributeName="stop-color"
                values="#8b5cf6;#ec4899;#f59e0b;#8b5cf6"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#ec4899">
              <animate
                attributeName="stop-color"
                values="#ec4899;#f59e0b;#8b5cf6;#ec4899"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// Bouncing dots loader
export function BouncingLoader() {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          animate={{
            y: [0, -20, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, memo, useMemo } from 'react'

interface TieBreakerWheelProps {
  options: { id: string; text: string; color: string }[]
  winnerId: string
  isVisible: boolean
  onComplete?: () => void
}

const TieBreakerWheel = memo(function TieBreakerWheel({ options, winnerId, isVisible, onComplete }: TieBreakerWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  
  const segmentAngle = useMemo(() => 360 / options.length, [options.length])
  const winnerIndex = useMemo(() => options.findIndex(opt => opt.id === winnerId), [options, winnerId])
  
  useEffect(() => {
    if (isVisible && !isSpinning) {
      setIsSpinning(true)
      // Calculate final rotation to land on winner
      // Add multiple full rotations for effect
      const baseRotations = 5 + Math.random() * 3
      const finalAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2)
      const totalRotation = baseRotations * 360 + finalAngle
      
      setRotation(totalRotation)
      
      // Call onComplete after animation
      setTimeout(() => {
        onComplete?.()
      }, 4000)
    }
  }, [isVisible, winnerIndex, segmentAngle, onComplete, isSpinning])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Breaking the Tie! 🎲
          </h2>
          
          <div className="relative w-80 h-80 mx-auto">
            {/* Wheel container */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ 
                duration: 4, 
                ease: [0.17, 0.67, 0.16, 0.99],
                delay: 0.5
              }}
            >
              {/* Wheel segments */}
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {options.map((option, index) => {
                  const startAngle = index * segmentAngle
                  const endAngle = (index + 1) * segmentAngle
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  
                  const x1 = 100 + 90 * Math.cos(startRad)
                  const y1 = 100 + 90 * Math.sin(startRad)
                  const x2 = 100 + 90 * Math.cos(endRad)
                  const y2 = 100 + 90 * Math.sin(endRad)
                  
                  const largeArc = segmentAngle > 180 ? 1 : 0
                  
                  const pathData = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`
                  
                  return (
                    <g key={option.id}>
                      {pathData && (
                        <path
                          d={pathData}
                          fill={option.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      )}
                      <text
                        x={100 + 50 * Math.cos((startRad + endRad) / 2)}
                        y={100 + 50 * Math.sin((startRad + endRad) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white pointer-events-none select-none"
                        transform={`rotate(${startAngle + segmentAngle / 2} ${100 + 50 * Math.cos((startRad + endRad) / 2)} ${100 + 50 * Math.sin((startRad + endRad) / 2)})`}
                      >
                        {option.text.length > 15 ? option.text.substring(0, 15) + '...' : option.text}
                      </text>
                    </g>
                  )
                })}
                
                {/* Center circle */}
                <circle cx="100" cy="100" r="15" fill="white" stroke="#6b7280" strokeWidth="2" />
              </svg>
            </motion.div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="relative"
              >
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-red-500" />
                <div className="absolute top-[35px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
              </motion.div>
            </div>
            
            {/* Decorative elements - removed for performance */}
          </div>
          
          <motion.p 
            className="text-center text-gray-600 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Let the wheel decide! 🎯
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

export default TieBreakerWheel
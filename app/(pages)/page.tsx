'use client'

import PollCreator from '@/components/plico/PollCreator'
import { motion } from 'framer-motion'
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon'

export default function HomePage() {
  // Set the sparkles favicon for the creation page
  useDynamicFavicon('✨')
  
  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          Stop arguing. Just send a Plico.
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          The fastest, most fun way to make a group decision. Period.
        </motion.p>
      </motion.div>
      
      <PollCreator />
    </div>
  )
}
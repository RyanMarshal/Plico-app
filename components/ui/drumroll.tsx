"use client";

import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";

interface DrumrollProps {
  onComplete: () => void;
  duration?: number;
}

const Drumroll = memo(function Drumroll({
  onComplete,
  duration = 1500,
}: DrumrollProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Use requestAnimationFrame for smoother counting
    let animationFrame: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * 100));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [duration, onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        <div className="text-6xl">🥁</div>
      </motion.div>

      <motion.div
        className="text-2xl font-bold text-gray-800 mb-2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        Tallying votes...
      </motion.div>

      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-3 w-3 bg-purple-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="mt-4 text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        {count}%
      </motion.div>
    </motion.div>
  );
});

export default Drumroll;

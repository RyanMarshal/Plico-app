"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface SuccessAnimationProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export default function SuccessAnimation({
  isVisible,
  message = "Success!",
  onComplete,
}: SuccessAnimationProps) {
  const [showDots, setShowDots] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    let dotsTimer: NodeJS.Timeout | undefined;
    let textTimer: NodeJS.Timeout | undefined;
    let completeTimer: NodeJS.Timeout | undefined;

    if (isVisible) {
      // Show dots after black screen appears
      dotsTimer = setTimeout(() => setShowDots(true), 500);
      // Hide dots and show winner text
      textTimer = setTimeout(() => {
        setShowDots(false);
        setShowText(true);
      }, 2000);
      // Hide everything after total time
      completeTimer = setTimeout(() => {
        setShowText(false);
        onComplete?.();
      }, 5000);
    }

    return () => {
      if (dotsTimer) clearTimeout(dotsTimer);
      if (textTimer) clearTimeout(textTimer);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  // Split the message into words and characters for animation
  const words = message.split(" ");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Dots animation for suspense */}
        <AnimatePresence>
          {showDots && (
            <motion.div
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {[".", ".", "."].map((dot, index) => (
                <motion.span
                  key={index}
                  className="inline-block mx-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    y: [10, -10, 10]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                >
                  {dot}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split text animation */}
        <AnimatePresence>
          {showText && (
            <motion.div
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block mx-2">
                  {word.split("").map((char, charIndex) => (
                    <motion.span
                      key={`${wordIndex}-${charIndex}`}
                      className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
                      initial={{
                        opacity: 0,
                        y: 50,
                        rotateX: -90,
                        scale: 0.5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        scale: 1,
                      }}
                      transition={{
                        type: "spring",
                        damping: 12,
                        stiffness: 200,
                        delay: wordIndex * 0.3 + charIndex * 0.05,
                      }}
                      style={{
                        textShadow: "0 0 40px rgba(168, 85, 247, 0.5)",
                        display: "inline-block",
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
              ))}

              {/* Animated sparkles around the text */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (i % 2 === 0 ? 1 : -1) * (50 + i * 20)],
                    y: [0, (i % 3 === 0 ? -1 : 1) * (30 + i * 15)],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 1.5 + i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import PollCreator from "@/components/plico/PollCreator";
import { motion } from "framer-motion";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import ShinyText from "@/components/reactbits/TextAnimations/ShinyText/ShinyText";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function HomePage() {
  // Set the sparkles favicon for the creation page
  useDynamicFavicon("✨");

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-12 px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight pb-2 relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Stop arguing. Just send a Plico.
            </span>
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-clip-text text-transparent"
              style={{
                backgroundSize: "50% 100%",
                WebkitBackgroundClip: "text",
              }}
              initial={{ backgroundPosition: "-100% 0" }}
              animate={{ backgroundPosition: "200% 0" }}
              transition={{
                duration: 8, // Even slower duration (8 seconds)
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 3, // Keep pause the same (3 seconds)
              }}
            >
              Stop arguing. Just send a Plico.
            </motion.span>
          </motion.h1>
          <div className="inline-block">
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 px-4 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              The fastest, most fun way to make a group decision. Period.
            </motion.p>
            <motion.div
              className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 mt-4 w-full"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />
          </div>
        </motion.div>

        <PollCreator />
      </div>
    </ErrorBoundary>
  );
}

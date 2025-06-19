"use client";

import { motion } from "framer-motion";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { useSoundContext } from "@/contexts/SoundContext";
import { memo } from "react";

const SoundToggle = memo(function SoundToggle() {
  const { isMuted, toggleMute } = useSoundContext();

  return (
    <motion.button
      onClick={toggleMute}
      className="relative p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isMuted ? 0 : 360 }}
        transition={{ duration: 0.3 }}
      >
        {isMuted ? (
          <SpeakerXMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <SpeakerWaveIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </motion.div>

      {/* Tooltip */}
      <motion.div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none"
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isMuted ? "Turn on sounds" : "Turn off sounds"}
      </motion.div>
    </motion.button>
  );
});

export default SoundToggle;

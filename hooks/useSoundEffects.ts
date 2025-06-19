import { Howl } from "howler";
import { useCallback } from "react";
import { useSoundContext } from "@/contexts/SoundContext";

// Create singleton sound instances outside the component
// This prevents creating new instances on every render
let sounds: Record<string, Howl | null> = {
  pop: null,
  whoosh: null,
  chime: null,
  rattle: null,
  tick: null,
  heartbeat: null,
};

// Only create Howl instances if we're in the browser
if (typeof window !== "undefined") {
  try {
    sounds.pop = new Howl({
      src: ["/sounds/pop.mp3"],
      volume: 0.7,
      preload: false, // Don't preload empty files
      html5: true,
      onloaderror: () => console.warn("Failed to load pop.mp3"),
    });

    sounds.whoosh = new Howl({
      src: ["/sounds/whoosh.mp3"],
      volume: 0.8,
      preload: false,
      html5: true,
      onloaderror: () => console.warn("Failed to load whoosh.mp3"),
    });

    sounds.chime = new Howl({
      src: ["/sounds/chime.mp3"],
      volume: 0.9,
      preload: false,
      html5: true,
      onloaderror: () => console.warn("Failed to load chime.mp3"),
    });

    sounds.rattle = new Howl({
      src: ["/sounds/rattle.mp3"],
      volume: 0.6,
      preload: false,
      html5: true,
      onloaderror: () => console.warn("Failed to load rattle.mp3"),
    });

    sounds.tick = new Howl({
      src: ["/sounds/tick.mp3"],
      volume: 0.5,
      preload: false,
      html5: true,
      onloaderror: () => console.warn("Failed to load tick.mp3"),
    });

    sounds.heartbeat = new Howl({
      src: ["/sounds/heartbeat.mp3"],
      volume: 0.4,
      preload: false,
      html5: true,
      onloaderror: () => console.warn("Failed to load heartbeat.mp3"),
    });
  } catch (error) {
    console.warn("Failed to initialize sound effects:", error);
  }
}

export const useSoundEffects = () => {
  const { isMuted } = useSoundContext();

  // Generic play function that respects mute state
  const playSound = useCallback(
    (soundName: keyof typeof sounds) => {
      if (isMuted) return;

      const sound = sounds[soundName];
      if (sound) {
        // Stop any currently playing instance and start fresh
        sound.stop();
        sound.play();
      }
    },
    [isMuted],
  );

  // Return specific play functions for each sound
  return {
    playPop: useCallback(() => playSound("pop"), [playSound]),
    playWhoosh: useCallback(() => playSound("whoosh"), [playSound]),
    playChime: useCallback(() => playSound("chime"), [playSound]),
    playRattle: useCallback(() => playSound("rattle"), [playSound]),
    playTick: useCallback(() => playSound("tick"), [playSound]),
    playHeartbeat: useCallback(() => playSound("heartbeat"), [playSound]),
  };
};

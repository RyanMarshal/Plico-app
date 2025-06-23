"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface ModernConfettiProps {
  isActive: boolean;
  particleCount?: number;
  duration?: number;
  spread?: number;
  origin?: { x: number; y: number };
  variant?: "celebration" | "subtle" | "burst" | "rain";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  path: string;
  emoji?: string;
}

// More sophisticated color palette with gradients
const colorPalettes = {
  celebration: [
    "linear-gradient(45deg, #FF6B6B, #FF8E53)",
    "linear-gradient(45deg, #4ECDC4, #44A08D)",
    "linear-gradient(45deg, #667EEA, #764BA2)",
    "linear-gradient(45deg, #F093FB, #F5576C)",
    "linear-gradient(45deg, #FA709A, #FEE140)",
    "linear-gradient(45deg, #30E8BF, #FF8235)",
    "linear-gradient(45deg, #8E2DE2, #4A00E0)",
    "linear-gradient(45deg, #FFC837, #FF6B6B)",
  ],
  subtle: [
    "rgba(139, 92, 246, 0.8)",
    "rgba(236, 72, 153, 0.8)",
    "rgba(245, 158, 11, 0.8)",
    "rgba(16, 185, 129, 0.8)",
  ],
};

const emojis = ["✨", "⭐", "🎉", "🎊", "💫", "🌟", "✦", "◆"];

const ModernConfetti = memo(function ModernConfetti({
  isActive,
  particleCount = 50,
  duration = 4000,
  spread = 360,
  origin = { x: 50, y: 50 },
  variant = "celebration",
}: ModernConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const colors =
      variant === "subtle" ? colorPalettes.subtle : colorPalettes.celebration;

    // Generate particles with custom paths and properties
    const newParticles: Particle[] = Array.from(
      { length: particleCount },
      (_, i) => {
        const angle =
          (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const velocity = 200 + Math.random() * 400;

        // Create bezier curve paths for more organic movement
        const midX =
          Math.cos(angle) * velocity * 0.5 + (Math.random() - 0.5) * 100;
        const midY = Math.sin(angle) * velocity * 0.5 - Math.random() * 200;
        const endX = Math.cos(angle) * velocity + (Math.random() - 0.5) * 200;
        const endY = Math.sin(angle) * velocity + 300 + Math.random() * 200;

        const path = `M 0,0 Q ${midX},${midY} ${endX},${endY}`;

        return {
          id: i,
          x: origin.x,
          y: origin.y,
          color: colors[Math.floor(Math.random() * colors.length)],
          size:
            variant === "subtle"
              ? 4 + Math.random() * 4
              : 6 + Math.random() * 8,
          delay: variant === "burst" ? 0 : Math.random() * 0.4,
          duration: duration / 1000 + Math.random() * 2,
          path,
          emoji:
            variant === "celebration" && Math.random() > 0.7
              ? emojis[Math.floor(Math.random() * emojis.length)]
              : undefined,
        };
      },
    );

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, duration + 2000);

    return () => clearTimeout(timer);
  }, [isActive, particleCount, duration, spread, origin, variant]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[100]">
        {/* Glow effect at origin */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: `${origin.x}%`,
            top: `${origin.y}%`,
            x: "-50%",
            y: "-50%",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 3, 4],
            opacity: [0, 0.3, 0],
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <div className="w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 blur-3xl" />
        </motion.div>

        {/* Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              x: "-50%",
              y: "-50%",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: particle.delay }}
          >
            {particle.emoji ? (
              <motion.div
                className="text-2xl"
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  rotate: 360,
                  x: (Math.random() - 0.5) * 200,
                  y: Math.random() * 400 + 100,
                }}
                transition={{
                  duration: particle.duration,
                  ease: "easeOut",
                  scale: { times: [0, 0.2, 1] },
                }}
              >
                {particle.emoji}
              </motion.div>
            ) : (
              <svg
                width={particle.size * 2}
                height={particle.size * 2}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.path
                  d={particle.path}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    pathLength: {
                      duration: particle.duration * 0.7,
                      ease: "easeOut",
                    },
                    opacity: {
                      duration: particle.duration,
                      times: [0, 0.1, 0.8, 1],
                    },
                  }}
                />
                <motion.circle
                  r={particle.size / 2}
                  fill="url(#gradient)"
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1.2, 1, 0],
                    offsetDistance: "100%",
                  }}
                  transition={{
                    duration: particle.duration,
                    ease: "easeOut",
                    scale: { times: [0, 0.2, 0.8, 1] },
                  }}
                  style={{
                    offsetPath: `path('${particle.path}')`,
                  }}
                >
                  <defs>
                    <linearGradient id="gradient">
                      <stop
                        offset="0%"
                        stopColor={
                          particle.color.includes("gradient")
                            ? "#FF6B6B"
                            : particle.color
                        }
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          particle.color.includes("gradient")
                            ? "#4ECDC4"
                            : particle.color
                        }
                      />
                    </linearGradient>
                  </defs>
                </motion.circle>
              </svg>
            )}

            {/* Trail effect */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                background: particle.color,
                filter: "blur(2px)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0.5],
                opacity: [0, 0.5, 0],
                x: (Math.random() - 0.5) * 100,
                y: Math.random() * 200 + 50,
              }}
              transition={{
                duration: particle.duration * 0.8,
                delay: particle.delay + 0.1,
              }}
            />
          </motion.div>
        ))}

        {/* Sparkle effects */}
        {particles.slice(0, 10).map((particle) => (
          <motion.div
            key={`sparkle-${particle.id}`}
            className="absolute"
            style={{
              left: `${particle.x + (Math.random() - 0.5) * 20}%`,
              top: `${particle.y + (Math.random() - 0.5) * 20}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: 180,
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay + Math.random() * 0.5,
              ease: "easeOut",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
                fill="white"
                opacity="0.8"
              />
            </svg>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
});

export default ModernConfetti;

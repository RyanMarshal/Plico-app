"use client";

import { motion } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface PhysicsConfettiProps {
  isActive: boolean;
  particleCount?: number;
  duration?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  color: string;
  size: number;
  shape: "square" | "circle";
}

const colors = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f97316",
  "#a855f7",
];

const PhysicsConfetti = memo(function PhysicsConfetti({
  isActive,
  particleCount = 100,
  duration = 5000,
  spread = 50,
  origin = { x: 50, y: 50 },
}: PhysicsConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) return;

    // Generate particles with physics properties
    const newParticles: Particle[] = Array.from(
      { length: particleCount },
      (_, i) => {
        const angle =
          (Math.PI / 180) * (270 - spread + Math.random() * spread * 2);
        const velocity = 350 + Math.random() * 200;

        return {
          id: i,
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          angle: Math.random() * 360,
          angularVelocity: (Math.random() - 0.5) * 600,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 6,
          shape: Math.random() > 0.5 ? "square" : "circle",
        };
      },
    );

    setParticles(newParticles);

    // Clear particles after duration
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, particleCount, duration, spread, origin]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="fixed"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.shape === "circle" ? "50%" : "0",
            willChange: "transform",
            transform: `translate(${particle.x}vw, ${particle.y}vh)`,
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: particle.angle,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: particle.vx,
            y: [
              0,
              particle.vy * 0.5,
              particle.vy * 0.8 + 200,
              particle.vy * 1.2 + 600,
            ],
            rotate: particle.angle + particle.angularVelocity,
            opacity: [1, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
          }}
          transition={{
            x: {
              type: "tween",
              ease: "linear",
              duration: duration / 1000,
            },
            y: {
              type: "tween",
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for gravity effect
              duration: duration / 1000,
            },
            rotate: {
              type: "tween",
              ease: "linear",
              duration: duration / 1000,
            },
            opacity: {
              duration: duration / 1000,
              times: [0, 0.7, 0.9, 1],
            },
            scale: {
              duration: duration / 1000,
              times: [0, 0.1, 0.5, 1],
            },
          }}
        />
      ))}

      {/* Add some larger accent pieces */}
      {particles.slice(0, particleCount / 10).map((particle, i) => (
        <motion.div
          key={`accent-${particle.id}`}
          className="fixed"
          style={{
            width: particle.size * 2,
            height: particle.size * 2,
            willChange: "transform",
            transform: `translate(${particle.x}vw, ${particle.y}vh)`,
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: particle.vx * 0.7,
            y: [
              0,
              particle.vy * 0.3,
              particle.vy * 0.6 + 300,
              particle.vy * 0.9 + 700,
            ],
            rotate: 720,
            opacity: [1, 1, 0.5, 0],
            scale: [0, 1.5, 1.2, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: "easeOut",
          }}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(45deg, ${particle.color}, ${colors[(i + 1) % colors.length]})`,
              borderRadius: "20%",
              transform: "rotate(45deg)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
});

export default PhysicsConfetti;

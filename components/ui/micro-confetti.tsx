"use client";

import { motion } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface MicroConfettiProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const MicroConfetti = memo(function MicroConfetti({
  x,
  y,
  onComplete,
}: MicroConfettiProps) {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: i * 30 + (Math.random() * 30 - 15),
      velocity: 100 + Math.random() * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
    })),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => {
        const endX =
          Math.cos((particle.angle * Math.PI) / 180) * particle.velocity;
        const endY =
          Math.sin((particle.angle * Math.PI) / 180) * particle.velocity;

        return (
          <motion.div
            key={particle.id}
            className="fixed w-2 h-2 rounded-full"
            style={{
              backgroundColor: particle.color,
              transform: `translate(${x}px, ${y}px)`,
              willChange: "transform",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: endX,
              y: endY,
              opacity: 0,
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
});

export default MicroConfetti;

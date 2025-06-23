"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, memo, useMemo } from "react";

interface TieBreakerModernProps {
  options: { id: string; text: string; color: string }[];
  winnerId: string;
  isVisible: boolean;
  onComplete?: () => void;
  variant?: "cards" | "slot" | "versus" | "quantum";
}

const TieBreakerModern = memo(function TieBreakerModern({
  options,
  winnerId,
  isVisible,
  onComplete,
  variant = "cards",
}: TieBreakerModernProps) {
  const [currentPhase, setCurrentPhase] = useState<
    "intro" | "animation" | "reveal"
  >("intro");
  const [revealedWinner, setRevealedWinner] = useState(false);

  const winnerOption = useMemo(
    () => options.find((opt) => opt.id === winnerId),
    [options, winnerId],
  );

  useEffect(() => {
    if (isVisible) {
      // Reset states when becoming visible
      setCurrentPhase("intro");
      setRevealedWinner(false);
      
      const timers: NodeJS.Timeout[] = [];
      
      // Start animation sequence
      timers.push(setTimeout(() => setCurrentPhase("animation"), 500));
      timers.push(setTimeout(() => setCurrentPhase("reveal"), 3000));
      timers.push(setTimeout(() => {
        setRevealedWinner(true);
      }, 4000));
      timers.push(setTimeout(() => onComplete?.(), 6000));
      
      // Cleanup timers on unmount or when isVisible changes
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {variant === "cards" && (
          <CardsVariant
            options={options}
            winnerId={winnerId}
            currentPhase={currentPhase}
            revealedWinner={revealedWinner}
            winnerOption={winnerOption}
          />
        )}
        {variant === "slot" && (
          <SlotMachineVariant
            options={options}
            winnerId={winnerId}
            currentPhase={currentPhase}
            revealedWinner={revealedWinner}
            winnerOption={winnerOption}
          />
        )}
        {variant === "versus" && (
          <VersusVariant
            options={options}
            winnerId={winnerId}
            currentPhase={currentPhase}
            revealedWinner={revealedWinner}
            winnerOption={winnerOption}
          />
        )}
        {variant === "quantum" && (
          <QuantumVariant
            options={options}
            winnerId={winnerId}
            currentPhase={currentPhase}
            revealedWinner={revealedWinner}
            winnerOption={winnerOption}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

// Modern Card Flip Animation
const CardsVariant = ({
  options,
  winnerId,
  currentPhase,
  revealedWinner,
  winnerOption,
}: {
  options: { id: string; text: string; color: string }[];
  winnerId: string;
  currentPhase: "intro" | "animation" | "reveal";
  revealedWinner: boolean;
  winnerOption?: { id: string; text: string; color: string };
}) => {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);

  useEffect(() => {
    if (currentPhase === "animation") {
      // Flip cards one by one
      options.forEach((option, index) => {
        setTimeout(() => {
          setFlippedCards((prev) => [...prev, option.id]);
        }, index * 300);
      });
    }
  }, [currentPhase, options]);

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 15 }}
    >
      {currentPhase === "intro" && (
        <motion.div className="text-center">
          <motion.h2
            className="text-4xl font-bold text-white mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎯 Breaking the Tie!
          </motion.h2>
          <motion.div
            className="w-16 h-16 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          </motion.div>
        </motion.div>
      )}

      {(currentPhase === "animation" || currentPhase === "reveal") && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {options.map((option) => (
            <motion.div
              key={option.id}
              className="relative h-40 w-60 cursor-pointer"
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: flippedCards.includes(option.id) ? 180 : 0,
                scale: revealedWinner && option.id === winnerId ? 1.2 : 1,
              }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Card Back */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-6xl">❓</span>
              </motion.div>

              {/* Card Front */}
              <motion.div
                className="absolute inset-0 rounded-xl flex items-center justify-center text-white font-bold text-xl p-4"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  backgroundColor:
                    option.id === winnerId && revealedWinner
                      ? "#10B981"
                      : option.color,
                }}
              >
                {option.text}
                {option.id === winnerId && revealedWinner && (
                  <motion.span
                    className="absolute -top-2 -right-2 text-4xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 20 }}
                    transition={{
                      type: "spring",
                      damping: 10,
                      stiffness: 100,
                    }}
                  >
                    👑
                  </motion.span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {revealedWinner && winnerOption && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 shadow-2xl text-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
          >
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Winner! 🎉
            </h3>
            <p className="text-xl font-semibold text-gray-800">
              {winnerOption.text}
            </p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Slot Machine Animation
const SlotMachineVariant = ({
  options,
  winnerId,
  currentPhase,
  revealedWinner,
  winnerOption,
}: {
  options: { id: string; text: string; color: string }[];
  winnerId: string;
  currentPhase: "intro" | "animation" | "reveal";
  revealedWinner: boolean;
  winnerOption?: { id: string; text: string; color: string };
}) => {
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let spinInterval: NodeJS.Timeout | undefined;
    
    if (currentPhase === "intro") {
      // Reset state when starting
      setSpinning(false);
      setCurrentIndex(0);
    } else if (currentPhase === "animation") {
      setSpinning(true);
      let spinCount = 0;
      spinInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % options.length);
        spinCount++;

        // Slow down and land on winner
        if (spinCount > 20) {
          if (spinInterval) clearInterval(spinInterval);
          const winnerIndex = options.findIndex((opt) => opt.id === winnerId);
          setCurrentIndex(winnerIndex);
          setSpinning(false);
        }
      }, 100);
    }
    
    return () => {
      if (spinInterval) clearInterval(spinInterval);
    };
  }, [currentPhase, options, winnerId]);

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 shadow-2xl"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 15 }}
    >
      <h2 className="text-4xl font-bold text-center mb-8 text-white">
        🎰 Tie Breaker Slot Machine
      </h2>

      <div className="relative h-32 w-96 mx-auto overflow-hidden rounded-xl bg-black/50 border-4 border-yellow-400 shadow-inner">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            y: spinning ? [-100, 100] : 0,
          }}
          transition={{
            duration: 0.1,
            repeat: spinning ? Infinity : 0,
            ease: "linear",
          }}
        >
          <div className="text-3xl font-bold text-white px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
            {options[currentIndex]?.text}
          </div>
        </motion.div>

        {/* Slot machine handle */}
        <motion.div
          className="absolute -right-8 top-1/2 -translate-y-1/2"
          animate={spinning ? { rotate: 30 } : {}}
          transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
        >
          <div className="w-4 h-20 bg-red-600 rounded-full" />
          <div className="w-8 h-8 bg-red-600 rounded-full -mt-2 -ml-2" />
        </motion.div>
      </div>

      {revealedWinner && winnerOption && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            animate={{ scale: 1.1 }}
            transition={{ duration: 0.5, repeat: 3, repeatType: "reverse" }}
            className="text-6xl mb-4"
          >
            🎊
          </motion.div>
          <h3 className="text-2xl font-bold text-yellow-400">JACKPOT!</h3>
          <p className="text-xl text-white mt-2">{winnerOption.text} Wins!</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Versus Battle Animation
const VersusVariant = ({
  options,
  winnerId,
  currentPhase,
  revealedWinner,
  winnerOption,
}: {
  options: { id: string; text: string; color: string }[];
  winnerId: string;
  currentPhase: "intro" | "animation" | "reveal";
  revealedWinner: boolean;
  winnerOption?: { id: string; text: string; color: string };
}) => {
  const [battleIntensity, setBattleIntensity] = useState(0);

  useEffect(() => {
    let battleInterval: NodeJS.Timeout | undefined;
    
    if (currentPhase === "intro") {
      // Reset state when starting
      setBattleIntensity(0);
    } else if (currentPhase === "animation") {
      let intensity = 0;
      battleInterval = setInterval(() => {
        intensity += 10;
        setBattleIntensity(intensity);
        if (intensity >= 100) {
          if (battleInterval) clearInterval(battleInterval);
        }
      }, 30);
    }
    
    return () => {
      if (battleInterval) clearInterval(battleInterval);
    };
  }, [currentPhase]);

  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto p-8"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <motion.h2
        className="text-5xl font-bold text-center text-white mb-12"
        animate={{
          textShadow:
            currentPhase === "animation"
              ? [
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 40px rgba(255,255,255,1)",
                ]
              : "0 0 20px rgba(255,255,255,0.5)",
        }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        ⚔️ FINAL SHOWDOWN ⚔️
      </motion.h2>

      <div className="flex justify-between items-center gap-8">
        {options.map((option, index) => (
          <motion.div
            key={option.id}
            className="flex-1 relative"
            animate={{
              x: currentPhase === "animation" ? (index === 0 ? -20 : 20) : 0,
              scale: revealedWinner && option.id === winnerId ? 1.3 : 1,
            }}
            transition={{
              x: {
                duration: 0.3,
                repeat: currentPhase === "animation" ? Infinity : 0,
              },
              scale: { duration: 0.5 },
            }}
          >
            <motion.div
              className={`
                p-8 rounded-2xl text-center text-white font-bold text-2xl
                ${
                  option.id === winnerId && revealedWinner
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                    : "bg-gradient-to-br from-purple-600 to-pink-600"
                }
              `}
              animate={{
                boxShadow:
                  currentPhase === "animation"
                    ? [
                        "0 0 30px rgba(255,255,255,0.3)",
                        "0 0 60px rgba(255,255,255,0.6)",
                      ]
                    : "0 0 30px rgba(255,255,255,0.3)",
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              {option.text}
              {option.id === winnerId && revealedWinner && (
                <motion.div
                  className="absolute -top-6 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <span className="text-6xl">👑</span>
                </motion.div>
              )}
            </motion.div>

            {/* Power level bar */}
            <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${option.id === winnerId ? "bg-yellow-400" : "bg-purple-500"}`}
                initial={{ width: "0%" }}
                animate={{
                  width:
                    currentPhase === "animation"
                      ? `${option.id === winnerId ? battleIntensity : battleIntensity * 0.8}%`
                      : "0%",
                }}
              />
            </div>
          </motion.div>
        ))}

        {/* VS indicator */}
        {options.length === 2 && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            animate={
              currentPhase === "animation"
                ? {
                    scale: 1.2,
                    rotate: [0, 10, -10, 0],
                  }
                : {}
            }
            transition={{
              scale: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
              rotate: { duration: 0.5, repeat: Infinity },
            }}
          >
            <div className="bg-red-600 text-white font-bold text-4xl px-6 py-3 rounded-lg shadow-2xl">
              VS
            </div>
          </motion.div>
        )}
      </div>

      {revealedWinner && winnerOption && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100 }}
          >
            <h3 className="text-6xl font-bold text-yellow-400 mb-4">
              VICTORY!
            </h3>
            <motion.div
              animate={{ y: -10 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="text-8xl"
            >
              🏆
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Quantum Particle Animation
const QuantumVariant = ({
  options,
  winnerId,
  currentPhase,
  revealedWinner,
  winnerOption,
}: {
  options: { id: string; text: string; color: string }[];
  winnerId: string;
  currentPhase: "intro" | "animation" | "reveal";
  revealedWinner: boolean;
  winnerOption?: { id: string; text: string; color: string };
}) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (currentPhase === "animation") {
      // Create particle effects
      const newParticles = options.map((option, index) => ({
        id: option.id,
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        color: option.color,
      }));
      setParticles(newParticles);
    }
  }, [currentPhase, options]);

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <motion.h2 className="text-4xl font-bold text-center text-white mb-8">
        🌌 Quantum Decision Engine 🌌
      </motion.h2>

      <div className="relative h-96 w-96 mx-auto">
        {/* Central core */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-20"
          animate={{
            scale: currentPhase === "animation" ? 1.5 : 1,
            rotate: currentPhase === "animation" ? 360 : 0,
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* Orbiting options */}
        {options.map((option, index) => {
          const angle = (index / options.length) * 2 * Math.PI;
          const radius = 120;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={option.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                x: currentPhase === "animation" ? [x, x * 0.5] : x,
                y: currentPhase === "animation" ? [y, y * 0.5] : y,
                scale: revealedWinner && option.id === winnerId ? 2 : 1,
              }}
              transition={{
                x: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                y: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                scale: { duration: 0.5 },
              }}
            >
              <motion.div
                className={`
                  px-6 py-3 rounded-full text-white font-bold
                  ${
                    option.id === winnerId && revealedWinner
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-purple-600 to-pink-600"
                  }
                `}
                animate={{
                  boxShadow:
                    currentPhase === "animation"
                      ? [
                          "0 0 20px rgba(255,255,255,0.5)",
                          "0 0 40px rgba(255,255,255,1)",
                        ]
                      : "0 0 20px rgba(255,255,255,0.5)",
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                {option.text}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Particle effects */}
        {currentPhase === "animation" &&
          particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: particle.color }}
              initial={{ left: "50%", top: "50%", opacity: 0 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: [0, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
      </div>

      {revealedWinner && winnerOption && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.h3
            className="text-3xl font-bold text-white mb-2"
            animate={{
              textShadow: ["0 0 20px #10B981", "0 0 40px #10B981"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            Quantum Collapse Complete!
          </motion.h3>
          <p className="text-xl text-green-400 font-semibold">
            Reality has chosen: {winnerOption.text}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TieBreakerModern;

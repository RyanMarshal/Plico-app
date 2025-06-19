"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { PlicoWithResults } from "@/lib/types";
import CountdownTimer from "./CountdownTimer";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const animationDuration = 0.5;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const barVariants = {
  hidden: { width: "0%" },
  visible: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  }),
};

// Lazy load heavy animation components
const Drumroll = dynamic(() => import("@/components/ui/drumroll"), {
  ssr: false,
  loading: () => null,
});

const WinnerSpotlight = dynamic(
  () => import("@/components/ui/winner-spotlight"),
  {
    ssr: false,
    loading: () => null,
  },
);

const PhysicsConfetti = dynamic(
  () => import("@/components/ui/physics-confetti"),
  {
    ssr: false,
    loading: () => null,
  },
);

const TieBreakerWheel = dynamic(
  () => import("@/components/ui/tie-breaker-wheel"),
  {
    ssr: false,
    loading: () => null,
  },
);

interface ResultsViewProps {
  poll: PlicoWithResults;
  isCreator: boolean;
  onFinalize: () => void;
  onTimerExpire?: () => void;
  isOptimisticUpdate?: boolean;
}

// Individual option component
const PollOption = memo(function PollOption({
  option,
  percentage,
  animatedVotes,
  isWinner,
  index,
}: {
  option: any;
  percentage: number;
  animatedVotes: number;
  isWinner: boolean;
  index: number;
}) {
  return (
    <motion.div
      className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden shadow-lg ${
        isWinner
          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
      initial={{ opacity: 0, x: -50 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isWinner ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        scale: {
          duration: 0.5,
          delay: 0.2,
        },
      }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <WinnerSpotlight winnerText={option.text} isVisible={isWinner} />
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-lg dark:text-gray-100">
          {option.text}
        </span>
        <motion.span
          className="text-base font-bold text-purple-600 dark:text-purple-400"
          key={animatedVotes} // Force re-animation on vote change
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(animatedVotes)} votes
        </motion.span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-8 overflow-hidden shadow-inner">
        <motion.div
          className={`h-full relative overflow-hidden ${
            isWinner
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : "bg-gradient-to-r from-purple-400 to-pink-500"
          }`}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ["0%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              transform: "skewX(-25deg)",
            }}
          />
        </motion.div>
      </div>

      <motion.div
        className="mt-2 text-base font-bold text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 + index * 0.1 }}
      >
        <span
          className={
            isWinner
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }
        >
          {percentage.toFixed(1)}%
        </span>
      </motion.div>

      {isWinner && (
        <motion.div
          className="absolute -top-2 -right-2 bg-green-500 dark:bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            damping: 10,
            stiffness: 100,
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1"
          >
            <motion.span
              aria-hidden="true"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              👑
            </motion.span>
            Winner!
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
});

export default function PollResultsFixed({
  poll: initialPoll,
  isCreator,
  onFinalize,
  onTimerExpire,
}: ResultsViewProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [animatedVotes, setAnimatedVotes] = useState<Record<string, number>>(
    () => {
      const votes: Record<string, number> = {};
      initialPoll.options.forEach((option) => {
        votes[option.id] = option.voteCount;
      });
      return votes;
    },
  );
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDrumroll, setShowDrumroll] = useState(false);
  const [revealResults, setRevealResults] = useState(false);
  const { playChime, playRattle } = useSoundEffects();

  const supabase = createSupabaseBrowserClient();
  const channelRef = useRef<any>(null);

  const totalVotes = poll.totalVotes || 1;

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return;
    if (initialPoll.isClosed) return;
    if (channelRef.current) return;

    console.log(
      "[PollResultsFixed] Setting up subscription for:",
      initialPoll.id,
    );

    const channel = supabase
      .channel(`poll-${initialPoll.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Option",
          filter: `plicoId=eq.${initialPoll.id}`,
        },
        (payload: any) => {
          console.log("[PollResultsFixed] Received update:", payload);

          if (payload.eventType === "UPDATE" && payload.new) {
            const updatedOption = payload.new;

            // Update both poll state and animated votes atomically
            setPoll((currentPoll) => {
              const newOptions = currentPoll.options.map((opt) =>
                opt.id === updatedOption.id
                  ? { ...opt, voteCount: updatedOption.voteCount }
                  : opt,
              );

              const newTotalVotes = newOptions.reduce(
                (sum, opt) => sum + opt.voteCount,
                0,
              );

              return {
                ...currentPoll,
                options: newOptions,
                totalVotes: newTotalVotes,
              };
            });

            setAnimatedVotes((current) => ({
              ...current,
              [updatedOption.id]: updatedOption.voteCount,
            }));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Plico",
          filter: `id=eq.${initialPoll.id}`,
        },
        async (payload: any) => {
          console.log("[PollResultsFixed] Plico update:", payload);

          if (payload.new.finalized) {
            // Fetch complete data when finalized
            try {
              const response = await fetch(`/api/plico/${initialPoll.id}`);
              const data = await response.json();

              if (data && !data.error) {
                const maxVotes = Math.max(
                  ...data.options.map((opt: any) => opt.voteCount),
                );
                const winners = data.options.filter(
                  (opt: any) => opt.voteCount === maxVotes && opt.voteCount > 0,
                );

                let winner = null;
                let isTie = false;

                if (winners.length === 1) {
                  winner = winners[0];
                } else if (winners.length > 1 && data.tieBreakWinnerId) {
                  winner = data.options.find(
                    (opt: any) => opt.id === data.tieBreakWinnerId,
                  );
                  isTie = true;
                }

                setPoll({
                  ...data,
                  winner,
                  isTie,
                  isClosed: true,
                });

                // Update animated votes
                const votes: Record<string, number> = {};
                data.options.forEach((option: any) => {
                  votes[option.id] = option.voteCount;
                });
                setAnimatedVotes(votes);

                setShowDrumroll(true);
              }
            } catch (err) {
              console.error("[PollResultsFixed] Error fetching data:", err);
            }
          }
        },
      )
      .subscribe((status: string) => {
        console.log("[PollResultsFixed] Subscription status:", status);

        if (status === "SUBSCRIBED") {
          // Fetch latest data on successful subscription
          fetch(`/api/plico/${initialPoll.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && !data.error) {
                setPoll(data);
                const votes: Record<string, number> = {};
                data.options.forEach((option: any) => {
                  votes[option.id] = option.voteCount;
                });
                setAnimatedVotes(votes);
              }
            });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log("[PollResultsFixed] Cleaning up subscription");
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, initialPoll.id, initialPoll.isClosed]);

  // Handle drumroll for closed polls
  useEffect(() => {
    if (poll.isClosed && !revealResults && poll.totalVotes > 0) {
      setShowDrumroll(true);
    }
  }, [poll.isClosed, revealResults, poll.totalVotes]);

  // Handle winner animations
  useEffect(() => {
    if (poll.isClosed && revealResults) {
      if (poll.isTie && poll.winner) {
        setTimeout(() => {
          setShowTieBreaker(true);
          playRattle();
          setTimeout(() => setShowTieBreaker(false), 3000);
        }, 500);
      } else if (poll.winner && !poll.isTie) {
        setTimeout(() => {
          setShowConfetti(true);
          playChime();
          setTimeout(() => setShowConfetti(false), 5000);
        }, 1500);
      }
    }
  }, [
    poll.isClosed,
    poll.isTie,
    poll.winner,
    revealResults,
    playChime,
    playRattle,
  ]);

  const getPercentage = useCallback(
    (voteCount: number) => {
      return totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
    },
    [totalVotes],
  );

  const handleDrumrollComplete = useCallback(() => {
    setShowDrumroll(false);
    setRevealResults(true);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {poll.question}
      </motion.h1>

      <AnimatePresence mode="wait">
        {showDrumroll && poll.isClosed ? (
          <Drumroll onComplete={handleDrumrollComplete} duration={2000} />
        ) : null}
      </AnimatePresence>

      {poll.closesAt && !poll.isClosed && (
        <div className="mb-6">
          <CountdownTimer
            closesAt={new Date(poll.closesAt)}
            onExpire={onTimerExpire || onFinalize}
          />
        </div>
      )}

      {(!showDrumroll || !poll.isClosed) && (
        <motion.div
          className="space-y-4 mb-6 pr-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {poll.options.map((option, index) => {
            const percentage = getPercentage(animatedVotes[option.id] || 0);
            const isWinner =
              poll.isClosed && poll.winner?.id === option.id && revealResults;

            return (
              <PollOption
                key={option.id}
                option={option}
                percentage={percentage}
                animatedVotes={animatedVotes[option.id] || 0}
                isWinner={isWinner}
                index={index}
              />
            );
          })}
        </motion.div>
      )}

      {(!showDrumroll || !poll.isClosed) && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-6 py-3 rounded-full font-semibold shadow-md">
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              🗳️
            </motion.span>
            Total votes: {poll.totalVotes}
          </div>
        </motion.div>
      )}

      {!poll.finalized &&
        !poll.closesAt &&
        isCreator &&
        poll.totalVotes > 0 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="mb-6 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl shadow-lg"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-base text-yellow-800 dark:text-yellow-200 font-medium">
                🎯 When everyone has voted, click below to finalize the results
                and declare a winner.
              </p>
            </motion.div>
            <motion.button
              onClick={onFinalize}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎆 Finalize Results
            </motion.button>
          </motion.div>
        )}

      {poll.isClosed && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-full font-medium">
            <span className="text-lg">🏁</span>
            {poll.finalized && poll.finalizedAt
              ? `Results finalized on ${new Date(poll.finalizedAt).toLocaleDateString()}`
              : poll.closesAt
                ? `Voting ended on ${new Date(poll.closesAt).toLocaleDateString()} at ${new Date(poll.closesAt).toLocaleTimeString()}`
                : "Voting has ended"}
          </div>
        </motion.div>
      )}

      <TieBreakerWheel
        options={poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        }))}
        winnerId={poll.winner?.id || ""}
        isVisible={showTieBreaker}
        onComplete={() => setShowTieBreaker(false)}
      />

      <PhysicsConfetti
        isActive={showConfetti}
        particleCount={150}
        duration={5000}
        spread={45}
        origin={{ x: 50, y: 30 }}
      />
    </div>
  );
}

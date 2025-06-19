"use client";

import { useEffect, useState, useRef } from "react";
import { PlicoWithResults } from "@/lib/types";
import { useRealtimeSubscription } from "@/lib/supabase/realtime-manager";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import CountdownTimer from "./CountdownTimer";
import dynamic from "next/dynamic";

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

export default function PollResultsHybrid({
  poll: initialPoll,
  isCreator,
  onFinalize,
  onTimerExpire,
  isOptimisticUpdate = false,
}: ResultsViewProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [isUsingPolling, setIsUsingPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeFailureCount = useRef(0);
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [hasShownTieBreaker, setHasShownTieBreaker] = useState(false);

  // Polling fallback function
  const fetchLatestResults = async () => {
    try {
      const response = await fetch(`/api/plico/${poll.id}`);
      if (!response.ok) return;

      const data = await response.json();
      setPoll(data);
      setLastUpdateTime(new Date());
    } catch (error) {
      // Polling error occurred
    }
  };

  // Start polling as fallback
  const startPolling = () => {
    if (!isUsingPolling) {
      // Falling back to polling mode
      setIsUsingPolling(true);
      setConnectionError("Using polling mode (real-time unavailable)");

      // Initial fetch
      fetchLatestResults();

      // Set up polling interval
      pollingIntervalRef.current = setInterval(fetchLatestResults, 3000); // Poll every 3 seconds
    }
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsUsingPolling(false);
  };

  // Configure real-time subscription for vote updates
  const voteSubscriptionConfig = poll
    ? {
        channelName: `plico-results-hybrid-${poll.id}`,
        table: "Option",
        event: "UPDATE" as const,
        filter: `plicoId=eq.${poll.id}`,
        onMessage: (payload: any) => {
          // Realtime vote update received

          // Reset failure count on successful message
          realtimeFailureCount.current = 0;

          // Stop polling if it was active
          if (isUsingPolling) {
            stopPolling();
            setConnectionError(null);
          }

          setPoll((currentPoll) => {
            if (!currentPoll) return currentPoll;

            const newOptions = currentPoll.options.map((opt) =>
              opt.id === payload.new.id
                ? { ...opt, voteCount: payload.new.voteCount }
                : opt,
            );

            // Recalculate total votes
            const newTotalVotes = newOptions.reduce(
              (acc, opt) => acc + opt.voteCount,
              0,
            );

            // Trigger update animation
            setShowUpdateAnimation(true);
            setTimeout(() => setShowUpdateAnimation(false), 1000);

            // Update last update time
            setLastUpdateTime(new Date());

            // Return a new object to guarantee a re-render
            return {
              ...currentPoll,
              options: newOptions,
              totalVotes: newTotalVotes,
            };
          });

          // Celebrate if this brings us to a milestone
          const newVoteCount = payload.new.voteCount;
          if (newVoteCount % 10 === 0 && newVoteCount > 0) {
            // Fire confetti for every 10 votes
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
            });
          }
        },
        onError: (error: Error) => {
          // Real-time error occurred
          realtimeFailureCount.current++;

          // Start polling after 3 failures
          if (realtimeFailureCount.current >= 3) {
            startPolling();
          } else {
            setConnectionError("Reconnecting to live updates...");
          }
        },
        onConnect: () => {
          // Connected to real-time updates
          realtimeFailureCount.current = 0;

          // Switch back from polling to real-time
          if (isUsingPolling) {
            stopPolling();
            setConnectionError(null);
          }
        },
        onDisconnect: () => {
          // Disconnected from real-time updates
          setConnectionError("Reconnecting to live updates...");
        },
      }
    : null;

  // Configure real-time subscription for poll finalization
  const pollSubscriptionConfig = poll
    ? {
        channelName: `plico-status-hybrid-${poll.id}`,
        table: "Plico",
        event: "UPDATE" as const,
        filter: `id=eq.${poll.id}`,
        onMessage: async (payload: any) => {
          // Realtime poll update received

          // If poll was finalized, fetch full data including winner calculations
          if (payload.new.finalized || payload.new.tieBreakWinnerId) {
            await fetchLatestResults();

            // Show confetti for finalization
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        },
        onError: (error: Error) => {
          // Poll subscription error occurred
        },
      }
    : null;

  useRealtimeSubscription(voteSubscriptionConfig);
  useRealtimeSubscription(pollSubscriptionConfig);

  // Update local state when initialPoll changes (for optimistic updates)
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  // Check if we should show tie-breaker animation
  useEffect(() => {
    if (poll.isClosed && poll.isTie && poll.winner && !hasShownTieBreaker) {
      setShowTieBreaker(true);
      setHasShownTieBreaker(true);
    }
  }, [poll.isClosed, poll.isTie, poll.winner, hasShownTieBreaker]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  if (!poll) {
    return <div>Loading...</div>;
  }

  const totalVotes = poll.options.reduce(
    (acc, option) => acc + option.voteCount,
    0,
  );
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount));

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {poll.question}
      </motion.h2>

      {/* Countdown Timer */}
      {poll.closesAt && !poll.isClosed && (
        <div className="mb-6">
          <CountdownTimer
            closesAt={new Date(poll.closesAt)}
            onExpire={onTimerExpire}
          />
        </div>
      )}

      {/* Connection Status */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 ${
              isUsingPolling
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200"
            } border rounded-lg text-sm`}
          >
            <span className="inline-block animate-pulse mr-2">
              {isUsingPolling ? "🔄" : "⚡"}
            </span>
            {connectionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Indicator */}
      <AnimatePresence>
        {showUpdateAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold"
          >
            Live Update!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {poll.options.map((option, index) => {
          const percentage =
            totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          const isWinning =
            option.voteCount === maxVotes && option.voteCount > 0;
          // Show crown for the winner (including tie-break winner) when poll is closed
          const showCrown =
            poll.isClosed &&
            ((poll.winner && poll.winner.id === option.id) ||
              (isWinning && !poll.isTie));

          return (
            <motion.div
              key={option.id}
              className={`relative ${
                showCrown
                  ? "ring-2 ring-green-400 dark:ring-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 shadow-lg shadow-green-200/50 dark:shadow-green-900/50 transform"
                  : ""
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: showCrown ? [1, 1.02, 1] : 1,
              }}
              transition={{
                delay: index * 0.1,
                scale: {
                  delay: 0.5,
                  duration: 0.5,
                },
              }}
            >
              {/* Winner Badge */}
              {showCrown && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-bold uppercase tracking-wider"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 100,
                    delay: 0.6,
                  }}
                >
                  Winner
                </motion.div>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  {option.text}
                  {showCrown && totalVotes > 0 && (
                    <motion.span
                      className="ml-2 text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      👑
                    </motion.span>
                  )}
                </span>
                <span className="font-bold text-lg">
                  {option.voteCount}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    ({Math.round(percentage)}%)
                  </span>
                </span>
              </div>

              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden shadow-inner">
                <motion.div
                  className={`absolute top-0 left-0 h-full rounded-full ${
                    showCrown
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/50"
                      : isWinning
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gradient-to-r from-purple-400 to-pink-400"
                  } shadow-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    delay: isOptimisticUpdate ? 0 : index * 0.1,
                  }}
                />

                {/* Animated shimmer effect */}
                {percentage > 0 && (
                  <motion.div
                    className="absolute top-0 left-0 h-full w-full opacity-30"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, white, transparent)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{
                      backgroundPosition: ["200% 0", "-200% 0"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="text-center mt-8 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Total Votes: {totalVotes}
        </p>

        {lastUpdateTime && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
            {isUsingPolling && " (polling)"}
          </p>
        )}
      </motion.div>

      {/* Finalize button */}
      {!poll.finalized && !poll.closesAt && isCreator && totalVotes > 0 && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={onFinalize}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏁 Finalize Results
          </motion.button>
        </motion.div>
      )}

      {poll.isClosed && (
        <motion.div
          className="text-center mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {poll.finalized ? "🏆 Results Finalized" : "⏰ Voting Has Ended"}
          </p>
        </motion.div>
      )}

      {/* Tie-breaker wheel */}
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
    </div>
  );
}

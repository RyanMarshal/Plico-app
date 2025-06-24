"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { PlicoWithResults } from "@/lib/types";
import { useRealtimeSubscription } from "@/lib/supabase/realtime-manager";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import dynamic from "next/dynamic";

const TieBreakerModern = dynamic(
  () => import("@/components/ui/tie-breaker-modern"),
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
  const winnerTextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revealWinnerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dotsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const finalizationAbortControllerRef = useRef<AbortController | null>(null);
  const [showTieBreaker, setShowTieBreaker] = useState(false);
  const [hasShownTieBreaker, setHasShownTieBreaker] = useState(false);
  // Use poll ID to deterministically select the same variant for all clients
  const tieBreakerVariant = useMemo<"cards" | "slot" | "versus" | "quantum">(() => {
    const variants = ["cards", "slot", "versus", "quantum"] as const;
    // Create a simple hash from the poll ID
    let hash = 0;
    for (let i = 0; i < poll.id.length; i++) {
      const char = poll.id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use absolute value to ensure positive index
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  }, [poll.id]);
  const [showBlackScreen, setShowBlackScreen] = useState(false);
  const [hideContent, setHideContent] = useState(false);
  const [revealWinner, setRevealWinner] = useState(false);
  const [showWinnerText, setShowWinnerText] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isInitialMount = useRef(true);

  // Cleanup effect for showUpdateAnimation
  useEffect(() => {
    if (showUpdateAnimation) {
      const timer = setTimeout(() => {
        setShowUpdateAnimation(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showUpdateAnimation]);

  // Polling fallback function
  const fetchLatestResults = async () => {
    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`/api/plico/${poll.id}`, {
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) return;

      const data = await response.json();
      setPoll(data);
      setLastUpdateTime(new Date());
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
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
    // Cancel any pending fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
            if (!currentPoll) {
              return currentPoll;
            }
            const newOptions = currentPoll.options.map((opt) => {
              if (opt.id === payload.new.id) {
                return { ...opt, voteCount: payload.new.voteCount };
              }
              return opt;
            });

            // Recalculate total votes
            const newTotalVotes = newOptions.reduce(
              (acc, opt) => acc + opt.voteCount,
              0,
            );


            // Trigger update animation
            setShowUpdateAnimation(true);

            // Update last update time
            setLastUpdateTime(new Date());

            // Return a new object to guarantee a re-render
            return {
              ...currentPoll,
              options: newOptions,
              totalVotes: newTotalVotes,
            };
          });
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

          // CRITICAL: When ANY finalization update is detected, ALL clients must fetch
          // the authoritative data from the API to ensure consistency
          if (payload.new.finalized || payload.new.tieBreakWinnerId) {
            
            // Fetch the complete, authoritative poll data from the API
            // This ensures all clients have the same data, including computed winner
            try {
              // Cancel any previous finalization fetch
              if (finalizationAbortControllerRef.current) {
                finalizationAbortControllerRef.current.abort();
              }
              
              // Create new abort controller for this request
              finalizationAbortControllerRef.current = new AbortController();
              
              const response = await fetch(`/api/plico/${poll.id}`, {
                signal: finalizationAbortControllerRef.current.signal,
              });
              if (response.ok) {
                const updatedPoll = await response.json();
                
                // Update the poll state with authoritative data
                setPoll(updatedPoll);
                
                // Handle different finalization scenarios
                if (updatedPoll.tieBreakWinnerId && updatedPoll.winner && updatedPoll.isTie) {
                  // The useEffect will detect this state change and trigger the animation
                } else if (!updatedPoll.isTie && updatedPoll.finalized && !hasStartedAnimation) {
                  // Non-tie finalization - show black screen animation
                  setHasStartedAnimation(true);
                  setRevealWinner(false);
                  setHideContent(true);
                  setShowBlackScreen(true);

                  // Clear any existing timers
                  if (winnerTextTimerRef.current)
                    clearTimeout(winnerTextTimerRef.current);
                  if (revealWinnerTimerRef.current)
                    clearTimeout(revealWinnerTimerRef.current);
                  if (dotsTimerRef.current)
                    clearTimeout(dotsTimerRef.current);

                  // Show "And the winner is..." text after delay
                  winnerTextTimerRef.current = setTimeout(
                    () => setShowWinnerText(true),
                    1000,
                  );

                  // After showing the text, transition to dots
                  setTimeout(() => {
                    setShowWinnerText(false);
                    setShowDots(true);
                  }, 3500);

                  // Hide everything and reveal winner after dots
                  revealWinnerTimerRef.current = setTimeout(() => {
                    setShowBlackScreen(false);
                    setShowDots(false);
                    setHideContent(false);
                    setRevealWinner(true);
                  }, 5000);
                }
              }
            } catch (error) {
              // Ignore abort errors
              if (error instanceof Error && error.name === 'AbortError') {
                return;
              }
              // Error fetching poll data
            }
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
    
    // If poll is finalized on page load, we need to show the winner
    if (initialPoll.finalized) {
      if (isInitialMount.current) {
        // This is a page load of an already-finalized poll
        setRevealWinner(true);
        // Ensure animation flags are set to 'done' or 'not active' to prevent re-triggering
        setHasStartedAnimation(true);
        setShowBlackScreen(false);
        setShowWinnerText(false);
        setShowDots(false);
        setShowTieBreaker(false);
        setHasShownTieBreaker(true); // Mark tie-breaker animation as already handled
      }
    }
    
    // Mark that we're no longer on initial mount
    isInitialMount.current = false;
  }, [initialPoll]);

  // Check if we should show tie-breaker animation or reveal winner
  useEffect(() => {
    
    // Only trigger if we have authoritative data showing a tie-break winner
    if (poll.isClosed && poll.isTie && poll.winner && poll.tieBreakWinnerId) {
      if (!hasShownTieBreaker && !showTieBreaker) {
        
        // Ensure we don't reveal winner immediately
        setRevealWinner(false);
        setShowTieBreaker(true);
        setHasShownTieBreaker(true);
        
        // Set a timer to reveal winner after animation duration
        // This ensures synchronization across all browsers
        const revealTimer = setTimeout(() => {
          setShowTieBreaker(false);
          setRevealWinner(true);
        }, 6500); // Matches animation duration + buffer
        
        return () => clearTimeout(revealTimer);
      }
    }
  }, [poll.isClosed, poll.isTie, poll.winner, poll.tieBreakWinnerId, hasShownTieBreaker, showTieBreaker]);

  // Ensure winner is revealed when poll is finalized
  useEffect(() => {
    if (poll.finalized && poll.winner) {
      // For non-tie scenarios, reveal after black screen animation
      if (!poll.isTie && !showBlackScreen && !showWinnerText && !showDots && !revealWinner && hasStartedAnimation) {
        setRevealWinner(true);
      }
      
      // For tie scenarios, reveal after tie-breaker animation
      if (poll.isTie && hasShownTieBreaker && !showTieBreaker && !revealWinner) {
        setRevealWinner(true);
      }
    }
  }, [poll.finalized, poll.winner, poll.isTie, showBlackScreen, showWinnerText, showDots, showTieBreaker, hasShownTieBreaker, revealWinner, hasStartedAnimation]);

  // Handle timer expiration animation
  useEffect(() => {
    if (
      poll.isClosed &&
      poll.closesAt &&
      !poll.finalized &&
      !showBlackScreen &&
      !hasStartedAnimation
    ) {
      if (!poll.isTie) {
        // Timer expired and NOT a tie - show black screen
        setHasStartedAnimation(true);
        setRevealWinner(false);
        setHideContent(true);
        setShowBlackScreen(true);

        // Clear any existing timers
        if (winnerTextTimerRef.current)
          clearTimeout(winnerTextTimerRef.current);
        if (revealWinnerTimerRef.current)
          clearTimeout(revealWinnerTimerRef.current);

        // Show text after delay
        winnerTextTimerRef.current = setTimeout(
          () => setShowWinnerText(true),
          1000,
        );

        // After showing the text, transition to dots
        dotsTimerRef.current = setTimeout(() => {
          setShowWinnerText(false);
          setShowDots(true);
        }, 3500);

        // Hide everything and reveal winner after 5 seconds (consistent timing)
        revealWinnerTimerRef.current = setTimeout(() => {
          setShowBlackScreen(false);
          setShowDots(false);
          setHideContent(false);
          setRevealWinner(true);
        }, 5000);
      } else {
        // For ties, don't reveal winner yet - wait for tie-breaker animation to complete
        setRevealWinner(false);
      }
    }
  }, [
    poll.isClosed,
    poll.closesAt,
    poll.finalized,
    poll.isTie,
    showBlackScreen,
    hasStartedAnimation,
  ]);

  // Cleanup polling and timers on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      // Clear animation timers
      if (winnerTextTimerRef.current) clearTimeout(winnerTextTimerRef.current);
      if (revealWinnerTimerRef.current)
        clearTimeout(revealWinnerTimerRef.current);
      if (dotsTimerRef.current) clearTimeout(dotsTimerRef.current);
      // Cancel any pending finalization fetch
      if (finalizationAbortControllerRef.current) {
        finalizationAbortControllerRef.current.abort();
        finalizationAbortControllerRef.current = null;
      }
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
      <motion.div
        animate={{ opacity: hideContent ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-8 relative"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            {poll.question}
          </span>
          {!shouldReduceMotion && (
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
              {poll.question}
            </motion.span>
          )}
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
              <span
                className={`inline-block mr-2 ${!shouldReduceMotion ? "animate-pulse" : ""}`}
              >
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
              revealWinner &&
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
                    {showCrown &&
                      totalVotes > 0 &&
                      (shouldReduceMotion ? (
                        <>
                          <span className="ml-2 text-2xl" aria-hidden="true">👑</span>
                          <span className="sr-only"> (Winner)</span>
                        </>
                      ) : (
                        <>
                          <motion.span
                            className="ml-2 text-2xl"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                              repeatDelay: 2,
                            }}
                            aria-hidden="true"
                          >
                            👑
                          </motion.span>
                          <span className="sr-only"> (Winner)</span>
                        </>
                      ))}
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
                  {percentage > 0 && !shouldReduceMotion && (
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

        {/* Creator Control Tip - Only show for polls without timer */}
        {!poll.finalized && !poll.closesAt && isCreator && (
          <motion.div
            className="mt-4 mx-auto max-w-md p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              <span>
                Keep this browser tab open to maintain creator controls. Only
                you can finalize the results.
              </span>
            </p>
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
              {poll.finalized && revealWinner
                ? "And the winner is... 💫"
                : "⏰ Voting Has Ended"}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Modern tie-breaker animation */}
      <TieBreakerModern
        options={poll.options.map((opt, index) => ({
          id: opt.id,
          text: opt.text,
          color: `hsl(${(index * 360) / poll.options.length}, 70%, 50%)`,
        }))}
        winnerId={poll.winner?.id || ""}
        isVisible={showTieBreaker}
        onComplete={() => {
          // Animation is done, hide it
          setShowTieBreaker(false);
        }}
        variant={tieBreakerVariant}
      />

      {/* Black screen with winner announcement */}
      <AnimatePresence>
        {showBlackScreen && (
          <motion.div
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {showWinnerText && (
                <motion.div
                  className="text-5xl md:text-6xl lg:text-7xl font-black text-center tracking-tight font-[family:var(--font-fredoka)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Split text animation */}
                  {"And the winner is...".split(" ").map((word, wordIndex) => (
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
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Dots animation for suspense */}
            <AnimatePresence>
              {showDots && (
                <motion.div
                  className="text-6xl md:text-7xl lg:text-8xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {[".", ".", "."].map((dot, index) => (
                    <motion.span
                      key={index}
                      className="inline-block mx-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        y: [10, -10, 10]
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: "easeInOut"
                      }}
                      style={{
                        textShadow: "0 0 40px rgba(168, 85, 247, 0.5)",
                      }}
                    >
                      {dot}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

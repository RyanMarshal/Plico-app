'use client';

import { useEffect, useState } from 'react';
import { PlicoWithResults } from '@/lib/types';
import { useRealtimeSubscription } from '@/lib/supabase/realtime-manager';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface ResultsViewProps {
  poll: PlicoWithResults
  isCreator: boolean
  onFinalize: () => void
  onTimerExpire?: () => void
  isOptimisticUpdate?: boolean
}

export default function PollResultsEnhanced({ 
  poll: initialPoll, 
  isCreator, 
  onFinalize, 
  onTimerExpire, 
  isOptimisticUpdate = false 
}: ResultsViewProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);

  // Configure real-time subscription
  const subscriptionConfig = poll ? {
    channelName: `plico-results-enhanced-${poll.id}`,
    table: 'Option',
    event: 'UPDATE' as const,
    filter: `plicoId=eq.${poll.id}`,
    onMessage: (payload: any) => {
      console.log('✅ Realtime Vote Update:', payload.new);
      
      setPoll((currentPoll) => {
        if (!currentPoll) return currentPoll;
        
        const newOptions = currentPoll.options.map((opt) =>
          opt.id === payload.new.id ? { ...opt, voteCount: payload.new.voteCount } : opt
        );

        // Recalculate total votes
        const newTotalVotes = newOptions.reduce((acc, opt) => acc + opt.voteCount, 0);

        // Trigger update animation
        setShowUpdateAnimation(true);
        setTimeout(() => setShowUpdateAnimation(false), 1000);
        
        // Update last update time
        setLastUpdateTime(new Date());

        // Return a new object to guarantee a re-render
        return { ...currentPoll, options: newOptions, totalVotes: newTotalVotes };
      });

      // Celebrate if this brings us to a milestone
      const newVoteCount = payload.new.voteCount;
      if (newVoteCount % 10 === 0 && newVoteCount > 0) {
        // Fire confetti for every 10 votes
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    },
    onError: (error: Error) => {
      console.error('[PollResultsEnhanced] Real-time error:', error);
      setConnectionError('Real-time updates temporarily unavailable');
    },
    onConnect: () => {
      console.log('[PollResultsEnhanced] Connected to real-time updates');
      setConnectionError(null);
    },
    onDisconnect: () => {
      console.log('[PollResultsEnhanced] Disconnected from real-time updates');
      setConnectionError('Reconnecting to live updates...');
    }
  } : null;

  useRealtimeSubscription(subscriptionConfig);

  // Update local state when initialPoll changes (for optimistic updates)
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  if (!poll) {
    return <div>Loading...</div>;
  }

  const totalVotes = poll.options.reduce((acc, option) => acc + option.voteCount, 0);
  const maxVotes = Math.max(...poll.options.map(o => o.voteCount));

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {poll.question}
      </motion.h2>

      {/* Connection Status */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-200"
          >
            <span className="inline-block animate-pulse mr-2">⚡</span>
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
          const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          const isWinning = option.voteCount === maxVotes && option.voteCount > 0;
          
          return (
            <motion.div 
              key={option.id} 
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  {option.text}
                  {isWinning && totalVotes > 0 && (
                    <motion.span
                      className="ml-2 text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
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
                    isWinning 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-r from-purple-400 to-pink-400'
                  } shadow-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    delay: isOptimisticUpdate ? 0 : index * 0.1 
                  }}
                />
                
                {/* Animated shimmer effect */}
                {percentage > 0 && (
                  <motion.div
                    className="absolute top-0 left-0 h-full w-full opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, white, transparent)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{
                      backgroundPosition: ['200% 0', '-200% 0'],
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
            {poll.finalized ? '🏆 Results Finalized' : '⏰ Voting Has Ended'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
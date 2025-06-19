"use client";

import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PlicoWithResults } from "@/lib/types";

interface ResultsViewProps {
  poll: PlicoWithResults;
  isCreator: boolean;
  onFinalize: () => void;
  onTimerExpire?: () => void;
  isOptimisticUpdate?: boolean;
}

export default function PollResultsWithPolling({
  poll: initialPoll,
  isCreator,
  onFinalize,
  onTimerExpire,
  isOptimisticUpdate = false,
}: ResultsViewProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Try to establish real-time connection
  useEffect(() => {
    console.log("[PollResults] Setting up subscription for poll:", poll.id);

    const channel = supabase
      .channel(`plico-results-${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Option",
          filter: `plicoId=eq.${poll.id}`,
        },
        (payload) => {
          console.log("✅ Realtime Vote Received:", payload.new);

          setPoll((currentPoll) => {
            if (!currentPoll) return currentPoll;

            const newOptions = currentPoll.options.map((opt) =>
              opt.id === payload.new.id
                ? { ...opt, voteCount: payload.new.voteCount }
                : opt,
            );

            const newTotalVotes = newOptions.reduce(
              (acc, opt) => acc + opt.voteCount,
              0,
            );
            return {
              ...currentPoll,
              options: newOptions,
              totalVotes: newTotalVotes,
            };
          });
        },
      )
      .subscribe((status) => {
        console.log("[PollResults] Subscription status:", status);

        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
          // Stop polling if real-time is working
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.log(
            "[PollResults] Real-time failed, falling back to polling",
          );
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      console.log("[PollResults] Cleaning up subscription for poll:", poll.id);
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  // Polling fallback when real-time is not available
  useEffect(() => {
    // Only poll if real-time is not connected and poll is not closed
    if (!isRealtimeConnected && !poll.isClosed) {
      console.log("[PollResults] Starting polling fallback");

      const fetchLatestData = async () => {
        try {
          const response = await fetch(`/api/plico/${poll.id}`);
          if (response.ok) {
            const data = await response.json();
            setPoll(data);
          }
        } catch (error) {
          console.error("[PollResults] Polling error:", error);
        }
      };

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(fetchLatestData, 2000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [isRealtimeConnected, poll.id, poll.isClosed]);

  if (!poll) {
    return <div>Loading...</div>;
  }

  const totalVotes = poll.options.reduce(
    (acc, option) => acc + option.voteCount,
    0,
  );

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">{poll.question}</h2>

      {/* Connection status indicator */}
      <div className="text-center mb-4">
        <span
          className={`text-sm ${isRealtimeConnected ? "text-green-600" : "text-orange-600"}`}
        >
          {isRealtimeConnected ? "🟢 Live updates" : "🟠 Polling mode (2s)"}
        </span>
      </div>

      <div className="space-y-4">
        {poll.options.map((option) => {
          const percentage =
            totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          return (
            <div key={option.id} className="relative">
              <div className="flex justify-between items-center mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>{option.text}</span>
                <span className="font-bold">
                  {option.voteCount} ({Math.round(percentage)}%)
                </span>
              </div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-orange-500 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-500 mt-6">
        Total Votes: {totalVotes}
      </p>

      {/* Finalize button */}
      {!poll.finalized && !poll.closesAt && isCreator && totalVotes > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={onFinalize}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Finalize Results
          </button>
        </div>
      )}

      {poll.isClosed && (
        <div className="text-center mt-6 text-gray-600">
          {poll.finalized ? "Results finalized" : "Voting has ended"}
        </div>
      )}
    </div>
  );
}

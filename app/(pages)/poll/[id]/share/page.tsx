"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlicoWithResults } from "@/lib/types";
import ShareButtons from "@/components/plico/ShareButtons";
import { motion, AnimatePresence } from "framer-motion";
import { MorphLoader } from "@/components/ui/plico-loader";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// Helper function to get relative time
function getRelativeTime(closesAt: Date): string {
  const now = new Date();
  const diff = closesAt.getTime() - now.getTime();

  if (diff <= 0) return "Voting has ended";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Voting ends in ${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `Voting ends in ${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0)
    return `Voting ends in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "Voting ends soon";
}

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  const [poll, setPoll] = useState<PlicoWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Use party popper emoji for the share page
  useDynamicFavicon("🎉");

  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : "";

  const fetchPoll = useCallback(async () => {
    try {
      const response = await fetch(`/api/plico/${pollId}`);
      if (!response.ok) throw new Error("Failed to load poll");
      const data = await response.json();
      setPoll(data);
    } catch (err) {
      // If poll doesn't exist, redirect to home
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [pollId, router]);

  useEffect(() => {
    fetchPoll();
  }, [pollId, fetchPoll]);

  const shareOrCopy = async () => {
    // Try native share first on mobile
    if (
      navigator.share &&
      /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          title: `Poll: ${poll?.question}`,
          text: `Vote on my poll: "${poll?.question}"`,
          url: pollUrl,
        });
        return; // Exit early if share was successful
      } catch (err) {
        // User cancelled share or share failed, fall through to copy
        if (err instanceof Error && err.name !== "AbortError") {
          // Share failed, falling back to copy
        }
      }
    }

    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = pollUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MorphLoader size="lg" />
      </div>
    );
  }

  if (!poll) return null;

  return (
    <>
      <div className="container mx-auto py-12 px-4">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              duration: 0.8,
              bounce: 0.5,
            }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 shadow-lg"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight pb-1 relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Let the voting begin! 🚀
              </span>
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
                Let the voting begin! 🚀
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 px-4 sm:px-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your #1 job is to share this link with your group.
            </motion.p>
          </motion.div>

          {/* Share Link Component - Hero Element */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-md"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <input
                type="text"
                value={pollUrl}
                readOnly
                className="flex-1 bg-transparent outline-none text-gray-700 font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <motion.button
                onClick={shareOrCopy}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md min-w-[140px] ${
                  copied
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={copied ? "copied" : "copy"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-5 h-5 hidden sm:block" />
                        <ShareIcon className="w-5 h-5 sm:hidden" />
                        <span className="hidden sm:inline">Copy Link</span>
                        <span className="sm:hidden">Share</span>
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>

            <motion.div
              className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: [
                  "0 0 20px rgba(251, 191, 36, 0.3)",
                  "0 0 40px rgba(251, 191, 36, 0.5)",
                  "0 0 20px rgba(251, 191, 36, 0.3)",
                ],
              }}
              transition={{
                delay: 0.65,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <p className="text-sm text-amber-900 dark:text-yellow-100 font-semibold flex items-center gap-2">
                <motion.span
                  className="text-xl"
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  💡
                </motion.span>
                <span>
                  <strong className="text-amber-900 dark:text-yellow-200">
                    Pro tip:
                  </strong>{" "}
                  Paste this link directly into your group chat. No sign-ups
                  required—everyone can vote instantly!
                </span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <ShareButtons
                url={pollUrl}
                text={`Vote on my poll: "${poll.question}"`}
              />
            </motion.div>
          </motion.div>

          {/* Gradient Separator Bar */}
          <motion.div
            className="w-full max-w-md mx-auto my-12"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
          </motion.div>

          {/* Poll Details Section */}
          <motion.div
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Your Plico
            </h2>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {poll.question}
            </h3>

            <div className="space-y-2 mb-4">
              {poll.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>{option.text}</span>
                </motion.div>
              ))}
            </div>

            {poll.closesAt && (
              <motion.div
                className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xl">⏱️</span>
                <span>{getRelativeTime(new Date(poll.closesAt))}</span>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="space-y-4 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              onClick={() => router.push(`/poll/${pollId}`)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 sm:px-10 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 min-h-[56px] active:scale-[0.98]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>View Live Poll</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xl"
              >
                →
              </motion.span>
            </motion.button>

            <motion.button
              onClick={() => router.push("/")}
              className="w-full bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 py-4 px-8 sm:px-10 rounded-xl font-semibold text-base sm:text-lg border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Create Another Plico ✨</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

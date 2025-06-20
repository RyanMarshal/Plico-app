"use client";

import { useState, FormEvent, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, getSmartDefaultDays, getSmartDefaultTimes } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

const MAX_QUESTION_LENGTH = 280;
const MAX_OPTION_LENGTH = 80;
const MAX_OPTIONS = 4;

const TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "24 hours", value: 1440 },
];

const QUESTION_PLACEHOLDERS = [
  "What's the big decision?",
  "Let's settle this...",
  "End the debate:",
  "Okay team, what's the move?",
  "Time to decide:",
  "Quick question for the group:",
  "Help me choose:",
  "What should we do?",
  "Poll the room:",
  "Democracy time!",
];

const QUICK_START_QUESTIONS = [
  {
    text: "What should we eat tonight?",
    emoji: "🍕",
    description: "The ultimate group decision",
    suggestedOptions: ["Pizza", "Tacos", "Sushi", "Burgers"],
  },
  {
    text: "What day works best for everyone?",
    emoji: "🗓️",
    description: "Schedule coordination made easy",
    suggestedOptions: getSmartDefaultDays(),
  },
  {
    text: "What should we do tonight?",
    emoji: "🎬",
    description: "Pick the perfect activity",
    suggestedOptions: ["Movie night", "Game night", "Go out", "Stay in"],
  },
  {
    text: "What time should we meet?",
    emoji: "⏰",
    description: "Nail down the timing",
    suggestedOptions: getSmartDefaultTimes(),
  },
  {
    text: "Which option do you prefer?",
    emoji: "🤔",
    description: "Quick A/B testing",
    suggestedOptions: ["Option A", "Option B", "", ""],
  },
];

// Memoized option component
const PollOption = memo(function PollOption({
  option,
  index,
  updateOption,
  removeOption,
  canRemove,
}: {
  option: string;
  index: number;
  updateOption: (index: number, value: string) => void;
  removeOption: (index: number) => void;
  canRemove: boolean;
}) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <input
        type="text"
        value={option}
        onChange={(e) => updateOption(index, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="w-full px-5 py-4 pr-24 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
        maxLength={MAX_OPTION_LENGTH}
        required={index < 2}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <motion.span
          className="text-sm"
          animate={{
            color:
              option.length > MAX_OPTION_LENGTH - 10 ? "#ef4444" : "#6b7280",
          }}
        >
          {option.length}/{MAX_OPTION_LENGTH}
        </motion.span>
        {canRemove && (
          <motion.button
            type="button"
            onClick={() => removeOption(index)}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label={`Remove option ${index + 1}`}
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});

const PollCreator = memo(function PollCreator() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(0); // default to "No Timer"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { playWhoosh } = useSoundEffects();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % QUESTION_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addOption = useCallback(() => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, ""]);
    }
  }, [options]);

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const removeOption = useCallback(
    (index: number) => {
      if (options.length > 2) {
        setOptions((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [options.length],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const filledOptions = options.filter((opt) => opt.trim());

    if (filledOptions.length < 2) {
      setError("Please provide at least 2 options");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/plico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: filledOptions,
          duration: duration > 0 ? duration : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create poll");
      }

      const plico = await response.json();

      // Admin key is now automatically set as HTTP-only cookie by the API
      // No need to manually handle creator cookies

      // Play sound and navigate
      playWhoosh();
      router.push(`/poll/${plico.id}/share`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto space-y-8 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Question Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <label
          htmlFor="question"
          className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200"
        >
          Your Question
        </label>
        <div className="relative group">
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={QUESTION_PLACEHOLDERS[placeholderIndex]}
            className="w-full px-5 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            required
          />
          <motion.div
            className="absolute bottom-3 right-3 text-sm"
            animate={{
              color:
                question.length > MAX_QUESTION_LENGTH - 20
                  ? "#ef4444"
                  : "#6b7280",
            }}
          >
            {question.length}/{MAX_QUESTION_LENGTH}
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Start Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
          Quick start with a popular question:
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {QUICK_START_QUESTIONS.map((q, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => {
                setQuestion(q.text);
                // Always update options when selecting a quick-start question
                // Recalculate smart defaults for time-sensitive questions
                let options = q.suggestedOptions;
                if (q.text === "What day works best for everyone?") {
                  options = getSmartDefaultDays();
                } else if (q.text === "What time should we meet?") {
                  options = getSmartDefaultTimes();
                }
                setOptions(options.slice(0, 4));
              }}
              className={`group flex items-center gap-2 px-4 py-3 min-h-[44px] border-2 rounded-full transition-all whitespace-nowrap active:scale-95 ${
                question === q.text
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{q.emoji}</span>
              <span
                className={`font-medium ${
                  question === q.text
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {q.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Options
        </label>
        <AnimatePresence mode="sync">
          {options.map((option, index) => (
            <PollOption
              key={index}
              option={option}
              index={index}
              updateOption={updateOption}
              removeOption={removeOption}
              canRemove={options.length > 2}
            />
          ))}
        </AnimatePresence>

        {options.length < MAX_OPTIONS && (
          <motion.button
            type="button"
            onClick={addOption}
            className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusCircleIcon className="w-5 h-5 inline mr-2" />
            Add Option
          </motion.button>
        )}
      </motion.div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Poll Timer (Optional)
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set a countdown timer to create urgency
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TIMER_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => setDuration(option.value)}
              className={cn(
                "py-3 px-4 rounded-xl font-medium transition-all",
                duration === option.value
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          size="lg"
        >
          {isSubmitting ? "Creating your poll..." : "Create Poll 🚀"}
        </Button>
      </motion.div>
    </motion.form>
  );
});

export default PollCreator;

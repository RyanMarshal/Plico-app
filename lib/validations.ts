import { z } from "zod";

export const createPollSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(280, "Question must be less than 280 characters")
    .trim(),
  options: z
    .array(
      z
        .string()
        .min(1, "Option cannot be empty")
        .max(80, "Option must be less than 80 characters")
        .trim(),
    )
    .min(2, "At least 2 options are required")
    .max(4, "Maximum 4 options allowed"),
  duration: z
    .number()
    .min(0)
    .max(1440) // Max 24 hours
    .optional(),
});

export const voteSchema = z.object({
  optionId: z.string().cuid(),
});

export const finalizeSchema = z.object({
  creatorId: z.string().cuid(),
});

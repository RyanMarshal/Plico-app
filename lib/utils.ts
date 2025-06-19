import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Intelligently suggests default poll options for "What day works best?"
 * based on the current day and ensuring no past days are suggested.
 * @returns {string[]} An array of suggested day strings.
 */
export const getSmartDefaultDays = (): string[] => {
  const now = new Date();
  const todayIndex = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // A map to easily get the numerical index of a day name.
  const dayMap: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday"];
  const weekend = ["Thursday", "Friday", "Saturday", "Sunday"];

  let potentialDays: string[];

  // 1. First, determine the context (work week vs. weekend planning).
  if (todayIndex >= 0 && todayIndex <= 2) {
    // Sun, Mon, Tue
    potentialDays = weekdays;
  } else {
    // Wed, Thu, Fri, Sat
    potentialDays = weekend;
  }

  // 2. Filter out any days from the list that have already passed.
  const upcomingDays = potentialDays.filter((day) => {
    const dayIndex = dayMap[day];
    // Special handling for Sunday (0) when comparing with days later in the week
    if (todayIndex === 0) {
      // On Sunday, all days are upcoming
      return true;
    }
    // For other days, include days that haven't passed yet
    // If the day is Sunday (0), consider it as future (7) for comparison
    const adjustedDayIndex = dayIndex === 0 ? 7 : dayIndex;
    const adjustedTodayIndex = todayIndex === 0 ? 7 : todayIndex;
    return adjustedDayIndex >= adjustedTodayIndex;
  });

  // If the filtering results in an empty list (e.g., it's Friday and we're suggesting weekdays),
  // return the original list to avoid showing no options. This is a sensible fallback.
  return upcomingDays.length > 0 ? upcomingDays : potentialDays;
};

/**
 * Intelligently suggests upcoming time slots for "What time should we meet?"
 * based on the current time.
 * @returns {string[]} An array of four suggested time strings.
 */
export const getSmartDefaultTimes = (): string[] => {
  const now = new Date();
  const currentHour = now.getHours(); // 0-23

  // Master list of common meeting/event times.
  const commonTimeSlots = [
    { label: "10:00 AM", hour: 10 },
    { label: "12:00 PM", hour: 12 },
    { label: "1:00 PM", hour: 13 },
    { label: "3:00 PM", hour: 15 },
    { label: "5:00 PM", hour: 17 },
    { label: "6:00 PM", hour: 18 },
    { label: "7:00 PM", hour: 19 },
    { label: "8:00 PM", hour: 20 },
    { label: "9:00 PM", hour: 21 },
  ];

  // Filter for times that are at least one hour in the future.
  const upcomingTimes = commonTimeSlots.filter(
    (slot) => slot.hour > currentHour,
  );

  // If we found at least 4 upcoming slots today, return the next 4.
  if (upcomingTimes.length >= 4) {
    return upcomingTimes.slice(0, 4).map((slot) => slot.label);
  }

  // If there are few or no slots left today, return a generic, useful default list.
  else {
    return ["12:00 PM", "3:00 PM", "6:00 PM", "8:00 PM"];
  }
};

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Interpolate template strings like "{questionId}-{titleSlug}"
 * with values from a record.
 */
export function interpolate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for rate limiting and backoff.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random jitter value between 0 and maxMs.
 */
export function jitter(maxMs: number): number {
  return Math.floor(Math.random() * maxMs);
}

/**
 * Slugify a string into lowercase hyphenated form.
 * Used for folder path generation to avoid spaces and special chars in git paths.
 * Examples:
 *   "Two Sum" → "two-sum"
 *   "3Sum Closest" → "3sum-closest"
 *   "N-Queens II" → "n-queens-ii"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

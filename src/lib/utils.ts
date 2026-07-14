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

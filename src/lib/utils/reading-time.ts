const DEFAULT_WPM = 200;

/**
 * Estimates reading time in whole minutes.
 *
 * @param text  The text to analyse.
 * @param wpm   Words per minute (default: 200).
 * @returns     Integer minutes, minimum 1.
 */
export function calculateReadingTime(text: string, wpm: number = DEFAULT_WPM): number {
  const trimmed = text.trim();
  if (!trimmed) return 1;

  const wordCount = trimmed.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wpm));
}

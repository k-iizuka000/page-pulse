import type { PageContentData } from "../messaging/types";
import { calculateReadingTime } from "../utils/reading-time";

const REMOVED_TAGS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "aside",
  "noscript",
] as const;

const MAX_CHARS = 5000;

/**
 * Extracts readable plain text from a Document without mutating it.
 *
 * Steps:
 * 1. Clone the document body.
 * 2. Remove noise elements (script, style, nav, header, footer, aside, noscript).
 * 3. Collapse whitespace.
 * 4. Truncate to MAX_CHARS at a word boundary.
 */
export function extractPageContent(doc: Document): PageContentData {
  // Clone so we never mutate the original document.
  const clone = doc.body.cloneNode(true) as HTMLElement;

  // Remove noise elements from the clone.
  REMOVED_TAGS.forEach((tag) => {
    clone.querySelectorAll(tag).forEach((el) => el.remove());
  });

  // Collapse whitespace.
  const raw = (clone.textContent ?? "").replace(/\s+/g, " ").trim();

  // Truncate at a word boundary.
  const text = truncateAtWordBoundary(raw, MAX_CHARS);

  return {
    url: doc.URL,
    title: doc.title,
    text,
    readingTimeMinutes: calculateReadingTime(text),
  };
}

function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(" ");

  // If no space is found, return the hard slice (edge case: one very long word).
  if (lastSpace === -1) return sliced;

  return sliced.slice(0, lastSpace);
}

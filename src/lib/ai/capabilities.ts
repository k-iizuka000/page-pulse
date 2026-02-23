/**
 * AI availability states for Chrome's built-in LanguageModel API.
 * - "available"    — model is ready to use
 * - "downloadable" — model can be downloaded on demand
 * - "downloading"  — model is currently downloading
 * - "unavailable"  — Chrome flags need to be enabled
 */
export type AIAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

/**
 * Returns the LanguageModel factory, supporting both the new global
 * `LanguageModel` (Chrome 138+) and the legacy `window.ai.languageModel`.
 */
export function getLanguageModelFactory(): AILanguageModelFactory | undefined {
  if (typeof LanguageModel !== "undefined") return LanguageModel;
  return window.ai?.languageModel;
}

/**
 * Checks the availability of the Chrome built-in LanguageModel API.
 * Supports both the new `availability()` method (returns string directly)
 * and the legacy `capabilities()` method (returns object with .available).
 * Returns "unavailable" if the API is not present or if the check throws.
 */
export async function checkAIAvailability(): Promise<AIAvailability> {
  const factory = getLanguageModelFactory();
  if (!factory) {
    return "unavailable";
  }
  try {
    // New API: LanguageModel.availability() returns a string directly
    if (typeof factory.availability === "function") {
      const result = await factory.availability();
      return result as AIAvailability;
    }
    // Legacy API: capabilities() returns { available: "..." }
    if (typeof factory.capabilities === "function") {
      const capabilities = await factory.capabilities();
      return capabilities.available;
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

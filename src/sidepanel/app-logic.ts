/**
 * Core initialization logic for the side panel app.
 *
 * Extracted from App.svelte so it can be unit-tested independently of the
 * Svelte rendering lifecycle (which vitest SSR compilation would otherwise
 * prevent from running onMount).
 */
import { checkAIAvailability, type AIAvailability } from "$lib/ai/capabilities";
import { getOrCreateSession } from "$lib/ai/session";
import { buildSummaryPrompt, parseSummaryResponse } from "$lib/ai/prompts";
import { sendMessage } from "$lib/messaging/bridge";
import { getSettings } from "$lib/storage/settings";
import type { Language } from "$lib/storage/types";
import type { SummaryData, PageContentData } from "$lib/messaging/types";

export type AppState = "checking" | "loading" | "ready" | "setup" | "error";

export interface AppStateResult {
  state: AppState;
  summary?: SummaryData;
  pageTitle?: string;
  errorMessage?: string;
  aiAvailability?: Exclude<AIAvailability, "available">;
  language?: Language;
}

/**
 * Runs the full initialization flow: check AI availability, check cache,
 * fetch page content, call AI, cache result.
 *
 * Returns a result object describing the resulting app state and any
 * relevant data. This is pure async logic with no Svelte reactivity — the
 * caller (App.svelte) applies the result to reactive variables.
 */
export async function runInitialize(
  languageOverride?: Language
): Promise<AppStateResult> {
  // Read language preference from settings (can be overridden by caller)
  const settings = await getSettings();
  const language = languageOverride ?? settings.language;

  // Step 1: Check AI availability
  const availability = await checkAIAvailability();
  if (availability !== "available") {
    return {
      state: "setup",
      aiAvailability: availability as Exclude<AIAvailability, "available">,
      language,
    };
  }

  // Step 2: Get the currently active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  const tabId = tab?.id;

  // tabId: 0 is valid — use == null instead of falsy check
  if (tabId == null) {
    return {
      state: "error",
      errorMessage: "Could not identify the current tab.",
      language,
    };
  }

  // Step 3: Check cache before calling AI
  const url = tab.url;
  if (url) {
    const cached = await sendMessage({ type: "GET_CACHED_SUMMARY", url });
    if (cached) {
      return {
        state: "ready",
        summary: cached,
        pageTitle: tab.title ?? "",
        language,
      };
    }
  }

  // Step 4: Not cached — fetch page content and call AI
  let content: PageContentData;
  try {
    content = await sendMessage({ type: "GET_PAGE_CONTENT", tabId });
  } catch (err) {
    return {
      state: "error",
      errorMessage: err instanceof Error ? err.message : "Failed to get page content.",
    };
  }

  try {
    const session = await getOrCreateSession();
    const { prompt, responseConstraint } = buildSummaryPrompt(
      content.text,
      content.title,
      language
    );

    let responseText = await session.prompt(prompt, { responseConstraint });

    // Attempt to parse — retry once with stricter prompt on JSON parse failure
    let parsed: SummaryData;
    try {
      parsed = parseSummaryResponse(responseText, content.readingTimeMinutes);
    } catch {
      // Retry with an explicit JSON-only instruction
      const retryPrompt = `${prompt}\n\nRespond with ONLY valid JSON. No markdown, no explanation.`;
      responseText = await session.prompt(retryPrompt, { responseConstraint });
      parsed = parseSummaryResponse(responseText, content.readingTimeMinutes);
    }

    // Step 5: Cache the result
    if (url) {
      await sendMessage({ type: "CACHE_SUMMARY", url, summary: parsed });
    }

    return {
      state: "ready",
      summary: parsed,
      pageTitle: content.title,
      language,
    };
  } catch (err) {
    return {
      state: "error",
      errorMessage:
        err instanceof Error ? err.message : "An unexpected error occurred.",
      language,
    };
  }
}

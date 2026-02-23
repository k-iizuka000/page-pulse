import type { Message, SummaryData } from "./types";
import { getCachedSummary, cacheSummary } from "$lib/storage/cache";

export type MessageResponse = unknown;

/**
 * Routes an incoming extension message to the appropriate handler and returns
 * the result. All async work is contained here; the service worker keeps the
 * message channel open by returning `true` from its onMessage listener.
 *
 * NOTE: This module MUST NOT import any AI / LanguageModel APIs — the
 * background service worker runs in a Web Worker context where Prompt API is
 * unavailable.
 */
export async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    case "OPEN_SIDE_PANEL": {
      // tabId is optional on this message type — content scripts cannot call
      // chrome.tabs.query for their own tab, so we fall back to sender.tab?.id.
      const tabId = message.tabId ?? sender.tab?.id;
      if (tabId == null) {
        return { success: false, error: "No tab ID" };
      }
      await chrome.sidePanel.open({ tabId });
      return { success: true };
    }

    case "GET_CACHED_SUMMARY":
      return getCachedSummary(message.url);

    case "CACHE_SUMMARY":
      await cacheSummary(message.url, message.summary);
      return { success: true };

    case "GET_PAGE_CONTENT": {
      const tabId = message.tabId ?? sender.tab?.id;
      if (tabId == null) return null;
      return chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_CONTENT" });
    }

    default:
      return undefined;
  }
}

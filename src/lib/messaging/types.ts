export interface PageContentData {
  url: string;
  title: string;
  text: string;
  readingTimeMinutes: number;
}

export interface SummaryData {
  summary: string;
  keyPoints: [string, string, string];
  techLevel: "beginner" | "intermediate" | "advanced";
  readingTimeMinutes: number;
  timestamp: number;
}

/**
 * Discriminated union of all messages exchanged between extension contexts.
 *
 * RPC-style: callers receive the raw response value directly (not wrapped in
 * an envelope message). As a result there are no result-carrying message
 * variants — responses are typed via MessageResponse<T>.
 *
 * Note: tabId on OPEN_SIDE_PANEL is optional because content scripts cannot
 * call chrome.tabs.query for their own tab. The background service worker
 * derives the tab ID from MessageSender.tab.id.
 */
export type Message =
  | { type: "GET_PAGE_CONTENT"; tabId: number }
  | { type: "OPEN_SIDE_PANEL"; tabId?: number }
  | { type: "GET_CACHED_SUMMARY"; url: string }
  | { type: "CACHE_SUMMARY"; url: string; summary: SummaryData };

/** Maps each outgoing message type to its expected response value. */
export type MessageResponse<T extends Message> =
  T extends { type: "GET_PAGE_CONTENT" }
    ? PageContentData
    : T extends { type: "OPEN_SIDE_PANEL" }
    ? void
    : T extends { type: "GET_CACHED_SUMMARY" }
    ? SummaryData | null
    : T extends { type: "CACHE_SUMMARY" }
    ? void
    : never;

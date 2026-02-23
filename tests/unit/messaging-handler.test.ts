import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SummaryData, PageContentData } from "../../src/lib/messaging/types";

// Chrome API mock — must be set up before any module imports that reference chrome
const mockChromeStorage = {
  local: {
    get: vi.fn(() => Promise.resolve({})),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  },
};

const mockChrome = {
  runtime: {
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
  },
  sidePanel: {
    open: vi.fn(() => Promise.resolve()),
    setPanelBehavior: vi.fn(() => Promise.resolve()),
  },
  tabs: {
    sendMessage: vi.fn(() =>
      Promise.resolve<PageContentData>({
        url: "https://example.com",
        title: "Example",
        text: "Page text",
        readingTimeMinutes: 3,
      })
    ),
  },
  storage: mockChromeStorage,
};

globalThis.chrome = mockChrome as any;

// Mock cache module before importing handler
vi.mock("$lib/storage/cache", () => ({
  getCachedSummary: vi.fn(),
  cacheSummary: vi.fn(),
}));

import { handleMessage } from "../../src/lib/messaging/handler";
import { getCachedSummary, cacheSummary } from "$lib/storage/cache";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSummary(overrides: Partial<SummaryData> = {}): SummaryData {
  return {
    summary: "A summary",
    keyPoints: ["Point 1", "Point 2", "Point 3"],
    techLevel: "beginner",
    readingTimeMinutes: 3,
    timestamp: 1000,
    ...overrides,
  };
}

function makeSender(tabId?: number): chrome.runtime.MessageSender {
  return tabId !== undefined ? { tab: { id: tabId } } : {};
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleMessage", () => {
  // ── OPEN_SIDE_PANEL ─────────────────────────────────────────────────────────
  describe("OPEN_SIDE_PANEL", () => {
    it("calls chrome.sidePanel.open with tabId from message", async () => {
      await handleMessage({ type: "OPEN_SIDE_PANEL", tabId: 42 }, makeSender());
      expect(mockChrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 42 });
    });

    it("falls back to sender.tab.id when message.tabId is undefined", async () => {
      await handleMessage({ type: "OPEN_SIDE_PANEL" }, makeSender(99));
      expect(mockChrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 99 });
    });

    it("returns { success: true } when sidePanel.open resolves", async () => {
      const result = await handleMessage(
        { type: "OPEN_SIDE_PANEL", tabId: 42 },
        makeSender()
      );
      expect(result).toEqual({ success: true });
    });

    it("returns { success: false, error: 'No tab ID' } when no tabId is available", async () => {
      const result = await handleMessage({ type: "OPEN_SIDE_PANEL" }, makeSender());
      expect(result).toEqual({ success: false, error: "No tab ID" });
      expect(mockChrome.sidePanel.open).not.toHaveBeenCalled();
    });

    it("accepts tabId: 0 as valid (edge value)", async () => {
      const result = await handleMessage(
        { type: "OPEN_SIDE_PANEL", tabId: 0 },
        makeSender()
      );
      expect(mockChrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 0 });
      expect(result).toEqual({ success: true });
    });

    it("propagates error when sidePanel.open rejects", async () => {
      mockChrome.sidePanel.open.mockRejectedValueOnce(new Error("panel error"));
      await expect(
        handleMessage({ type: "OPEN_SIDE_PANEL", tabId: 42 }, makeSender())
      ).rejects.toThrow("panel error");
    });
  });

  // ── GET_CACHED_SUMMARY ──────────────────────────────────────────────────────
  describe("GET_CACHED_SUMMARY", () => {
    it("calls getCachedSummary with the provided URL", async () => {
      vi.mocked(getCachedSummary).mockResolvedValueOnce(null);
      await handleMessage(
        { type: "GET_CACHED_SUMMARY", url: "https://example.com" },
        makeSender()
      );
      expect(getCachedSummary).toHaveBeenCalledWith("https://example.com");
    });

    it("returns cached SummaryData when found", async () => {
      const summary = makeSummary({ summary: "cached result" });
      vi.mocked(getCachedSummary).mockResolvedValueOnce(summary);
      const result = await handleMessage(
        { type: "GET_CACHED_SUMMARY", url: "https://example.com" },
        makeSender()
      );
      expect(result).toEqual(summary);
    });

    it("returns null when no cache entry exists", async () => {
      vi.mocked(getCachedSummary).mockResolvedValueOnce(null);
      const result = await handleMessage(
        { type: "GET_CACHED_SUMMARY", url: "https://example.com" },
        makeSender()
      );
      expect(result).toBeNull();
    });
  });

  // ── CACHE_SUMMARY ───────────────────────────────────────────────────────────
  describe("CACHE_SUMMARY", () => {
    it("calls cacheSummary with URL and summary data", async () => {
      vi.mocked(cacheSummary).mockResolvedValueOnce(undefined);
      const summary = makeSummary();
      await handleMessage(
        { type: "CACHE_SUMMARY", url: "https://example.com", summary },
        makeSender()
      );
      expect(cacheSummary).toHaveBeenCalledWith("https://example.com", summary);
    });

    it("returns { success: true } after caching", async () => {
      vi.mocked(cacheSummary).mockResolvedValueOnce(undefined);
      const result = await handleMessage(
        { type: "CACHE_SUMMARY", url: "https://example.com", summary: makeSummary() },
        makeSender()
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ── GET_PAGE_CONTENT ────────────────────────────────────────────────────────
  describe("GET_PAGE_CONTENT", () => {
    it("forwards message to content script via chrome.tabs.sendMessage", async () => {
      await handleMessage({ type: "GET_PAGE_CONTENT", tabId: 7 }, makeSender());
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
        type: "GET_PAGE_CONTENT",
      });
    });

    it("falls back to sender.tab.id when message has no tabId", async () => {
      const pageContent = { url: "https://example.com", title: "Test", text: "Content", readingTimeMinutes: 3 };
      mockChrome.tabs.sendMessage.mockResolvedValueOnce(pageContent);
      const result = await handleMessage(
        { type: "GET_PAGE_CONTENT" } as any,
        { tab: { id: 99 } } as any
      );
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(99, { type: "GET_PAGE_CONTENT" });
      expect(result).toEqual(pageContent);
    });

    it("returns the content script PageContentData response", async () => {
      const pageContent: PageContentData = {
        url: "https://test.com",
        title: "Test Page",
        text: "Test text",
        readingTimeMinutes: 5,
      };
      mockChrome.tabs.sendMessage.mockResolvedValueOnce(pageContent);
      const result = await handleMessage(
        { type: "GET_PAGE_CONTENT", tabId: 7 },
        makeSender()
      );
      expect(result).toEqual(pageContent);
    });

    it("returns null when no tabId is resolvable", async () => {
      const result = await handleMessage(
        { type: "GET_PAGE_CONTENT" } as any,
        {} as any
      );
      expect(result).toBeNull();
      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });

  // ── Unknown message type ────────────────────────────────────────────────────
  describe("unknown message type", () => {
    it("returns undefined for an unknown message type", async () => {
      const result = await handleMessage(
        { type: "UNKNOWN_TYPE" } as any,
        makeSender()
      );
      expect(result).toBeUndefined();
    });

    it("does not throw for an unknown message type", async () => {
      await expect(
        handleMessage({ type: "UNKNOWN_TYPE" } as any, makeSender())
      ).resolves.not.toThrow();
    });
  });
});

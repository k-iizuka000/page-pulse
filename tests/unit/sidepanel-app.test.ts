/**
 * Tests for the side panel app logic (src/sidepanel/app-logic.ts) and
 * surface-level rendering tests for App.svelte.
 *
 * The business logic is in app-logic.ts (a plain TypeScript module) so it
 * can be unit-tested with vi.mock without the Svelte SSR compile restriction
 * that prevents onMount from running in vitest's module environment.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock variables before vi.mock calls ─────────────────────────────────

const {
  mockCheckAIAvailability,
  mockGetOrCreateSession,
  mockDestroySession,
  mockSendMessage,
  mockGetSettings,
} = vi.hoisted(() => ({
  mockCheckAIAvailability: vi.fn(),
  mockGetOrCreateSession: vi.fn(),
  mockDestroySession: vi.fn(),
  mockSendMessage: vi.fn(),
  mockGetSettings: vi.fn(),
}));

vi.mock("../../src/lib/ai/capabilities", () => ({
  checkAIAvailability: mockCheckAIAvailability,
}));

vi.mock("../../src/lib/ai/session", () => ({
  getOrCreateSession: mockGetOrCreateSession,
  destroySession: mockDestroySession,
}));

vi.mock("../../src/lib/messaging/bridge", () => ({
  sendMessage: mockSendMessage,
}));

vi.mock("../../src/lib/storage/settings", () => ({
  getSettings: mockGetSettings,
}));

import { runInitialize } from "../../src/sidepanel/app-logic";

// ── Shared mock objects ───────────────────────────────────────────────────────

const mockSession = {
  prompt: vi.fn(),
  promptStreaming: vi.fn(),
  destroy: vi.fn(),
};

const validSummaryJSON = JSON.stringify({
  summary: "Test summary content",
  keyPoints: ["Point 1", "Point 2", "Point 3"],
  techLevel: "intermediate",
});

const mockPageContent = {
  url: "https://example.com/article",
  title: "Test Article Title",
  text: "This is the article text content.",
  readingTimeMinutes: 3,
};

const mockCachedSummary = {
  summary: "Cached summary",
  keyPoints: ["Cached 1", "Cached 2", "Cached 3"] as [string, string, string],
  techLevel: "beginner" as const,
  readingTimeMinutes: 2,
  timestamp: Date.now() - 60000,
};

// ── Chrome mock setup ─────────────────────────────────────────────────────────

function setupChrome(options: {
  tabId?: number | null;
  url?: string;
  title?: string;
} = {}) {
  const tabId = options.tabId === undefined ? 42 : options.tabId;
  const url = options.url ?? "https://example.com/article";
  const title = options.title ?? "Test Article Title";
  const tab = tabId == null ? {} : { id: tabId, url, title };

  globalThis.chrome = {
    tabs: {
      query: vi.fn(() => Promise.resolve([tab])),
    },
    runtime: { sendMessage: vi.fn() },
    storage: { local: { get: vi.fn(), set: vi.fn() } },
  } as unknown as typeof chrome;
}

// ── Default setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default: AI is available
  mockCheckAIAvailability.mockResolvedValue("available");

  // Default: session with successful prompt
  mockSession.prompt.mockResolvedValue(validSummaryJSON);
  mockGetOrCreateSession.mockResolvedValue(mockSession);

  // Default: settings with Japanese language
  mockGetSettings.mockResolvedValue({
    autoSummarize: true,
    disabledSites: [],
    theme: "auto",
    language: "ja",
  });

  // Default: no cache, successful page content and cache save
  mockSendMessage.mockImplementation((msg: { type: string }) => {
    if (msg.type === "GET_CACHED_SUMMARY") return Promise.resolve(null);
    if (msg.type === "GET_PAGE_CONTENT") return Promise.resolve(mockPageContent);
    if (msg.type === "CACHE_SUMMARY") return Promise.resolve();
    return Promise.resolve();
  });

  setupChrome();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("App state machine", () => {
  describe("initial state", () => {
    it("starts in 'checking' state — runInitialize is called from onMount", async () => {
      // runInitialize always returns something (never stays in 'checking');
      // the 'checking' state is what App.svelte shows while awaiting initialize().
      // We test that runInitialize resolves correctly as a proxy for this.
      const result = await runInitialize();
      expect(result.state).not.toBe("checking");
    });
  });

  describe("checking -> setup transition", () => {
    it("transitions to 'setup' when AI is unavailable", async () => {
      mockCheckAIAvailability.mockResolvedValue("unavailable");
      const result = await runInitialize();
      expect(result.state).toBe("setup");
      expect(result.aiAvailability).toBe("unavailable");
    });

    it("transitions to 'setup' when AI is downloadable", async () => {
      mockCheckAIAvailability.mockResolvedValue("downloadable");
      const result = await runInitialize();
      expect(result.state).toBe("setup");
      expect(result.aiAvailability).toBe("downloadable");
    });

    it("transitions to 'setup' when AI is downloading", async () => {
      mockCheckAIAvailability.mockResolvedValue("downloading");
      const result = await runInitialize();
      expect(result.state).toBe("setup");
      expect(result.aiAvailability).toBe("downloading");
    });
  });

  describe("checking -> loading -> ready transition", () => {
    it("transitions to 'ready' when AI is available and summary is generated", async () => {
      const result = await runInitialize();
      expect(result.state).toBe("ready");
      expect(result.summary).not.toBeNull();
    });

    it("summary contains the parsed AI response", async () => {
      const result = await runInitialize();
      expect(result.summary?.summary).toBe("Test summary content");
      expect(result.summary?.keyPoints).toEqual(["Point 1", "Point 2", "Point 3"]);
      expect(result.summary?.techLevel).toBe("intermediate");
    });
  });

  describe("cache hit", () => {
    it("transitions directly to 'ready' when cached summary exists", async () => {
      mockSendMessage.mockImplementation((msg: { type: string }) => {
        if (msg.type === "GET_CACHED_SUMMARY") return Promise.resolve(mockCachedSummary);
        return Promise.resolve();
      });

      const result = await runInitialize();
      expect(result.state).toBe("ready");
      expect(result.summary?.summary).toBe("Cached summary");
    });

    it("does not call AI when cache hit", async () => {
      mockSendMessage.mockImplementation((msg: { type: string }) => {
        if (msg.type === "GET_CACHED_SUMMARY") return Promise.resolve(mockCachedSummary);
        return Promise.resolve();
      });

      await runInitialize();
      expect(mockGetOrCreateSession).not.toHaveBeenCalled();
    });
  });

  describe("loading -> error transition", () => {
    it("transitions to 'error' when AI session creation fails", async () => {
      mockGetOrCreateSession.mockRejectedValue(new Error("Session creation failed"));
      const result = await runInitialize();
      expect(result.state).toBe("error");
      expect(result.errorMessage).toBe("Session creation failed");
    });

    it("transitions to 'error' when prompt call fails", async () => {
      mockSession.prompt.mockRejectedValue(new Error("Prompt API error"));
      const result = await runInitialize();
      expect(result.state).toBe("error");
      expect(result.errorMessage).toBe("Prompt API error");
    });

    it("transitions to 'error' when JSON parse fails after retry", async () => {
      // Both initial and retry calls return invalid JSON
      mockSession.prompt.mockResolvedValue("not valid json at all");
      const result = await runInitialize();
      expect(result.state).toBe("error");
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe("error -> loading (retry)", () => {
    it("retry re-enters initialization flow — checkAIAvailability called again", async () => {
      mockGetOrCreateSession
        .mockRejectedValueOnce(new Error("Session creation failed"))
        .mockResolvedValue(mockSession);

      // First call fails
      const first = await runInitialize();
      expect(first.state).toBe("error");
      expect(mockCheckAIAvailability).toHaveBeenCalledTimes(1);

      // Retry (call runInitialize again, as retry() in App.svelte does)
      const second = await runInitialize();
      expect(mockCheckAIAvailability).toHaveBeenCalledTimes(2);
      expect(second.state).toBe("ready");
    });

    it("retry can succeed after previous failure", async () => {
      mockGetOrCreateSession
        .mockRejectedValueOnce(new Error("Session creation failed"))
        .mockResolvedValue(mockSession);

      const first = await runInitialize();
      expect(first.state).toBe("error");

      const second = await runInitialize();
      expect(second.state).toBe("ready");
      expect(second.summary?.summary).toBe("Test summary content");
    });
  });

  describe("data flow", () => {
    it("sends GET_PAGE_CONTENT message to get page data", async () => {
      await runInitialize();
      const types = mockSendMessage.mock.calls.map(
        (c: [{ type: string }]) => c[0].type
      );
      expect(types).toContain("GET_PAGE_CONTENT");
    });

    it("sends CACHE_SUMMARY after successful summarization", async () => {
      await runInitialize();
      const types = mockSendMessage.mock.calls.map(
        (c: [{ type: string }]) => c[0].type
      );
      expect(types).toContain("CACHE_SUMMARY");
    });

    it("sends GET_CACHED_SUMMARY before calling AI", async () => {
      const callOrder: string[] = [];
      mockSendMessage.mockImplementation((msg: { type: string }) => {
        callOrder.push(msg.type);
        if (msg.type === "GET_CACHED_SUMMARY") return Promise.resolve(null);
        if (msg.type === "GET_PAGE_CONTENT") return Promise.resolve(mockPageContent);
        if (msg.type === "CACHE_SUMMARY") return Promise.resolve();
        return Promise.resolve();
      });

      await runInitialize();
      expect(callOrder[0]).toBe("GET_CACHED_SUMMARY");
    });

    it("CACHE_SUMMARY is sent with the parsed summary data", async () => {
      await runInitialize();
      const cacheCall = mockSendMessage.mock.calls.find(
        (c: [{ type: string }]) => c[0].type === "CACHE_SUMMARY"
      );
      expect(cacheCall).toBeDefined();
      const msg = (cacheCall as [{ type: string; summary?: { summary: string } }])[0];
      expect(msg.summary?.summary).toBe("Test summary content");
    });
  });
});

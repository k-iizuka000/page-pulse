/**
 * Tests for src/content/index.ts
 *
 * The content script exports init() for testability. All external
 * dependencies are mocked so init() can be called directly without
 * relying on module-level side effects.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Chrome API mock ────────────────────────────────────────────────────────
const mockSendMessage = vi.fn(() => Promise.resolve());
const mockAddListener = vi.fn();

globalThis.chrome = {
  runtime: {
    id: "test-extension-id",
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: mockAddListener,
    },
  },
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
  },
} as unknown as typeof chrome;

// ─── Module dependency mocks ────────────────────────────────────────────────
vi.mock("$lib/storage/settings", () => ({
  isDisabledSite: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("$lib/extractor/page-content", () => ({
  extractPageContent: vi.fn(() => ({
    url: "https://example.com/article",
    title: "Test Article",
    text: "This is the article body text.",
    readingTimeMinutes: 3,
  })),
}));

// Badge.svelte mock — must come before the import of the content script
vi.mock("../../src/content/Badge.svelte", () => ({
  default: vi.fn().mockImplementation(() => ({
    $destroy: vi.fn(),
  })),
}));

// badge.css?inline mock
vi.mock("../../src/content/badge.css?inline", () => ({
  default: ".badge { color: white; }",
}));

// Import mocked helpers after vi.mock declarations
import { isDisabledSite } from "$lib/storage/settings";
import { extractPageContent } from "$lib/extractor/page-content";

// Import the function under test (must be after all vi.mock calls)
import { init } from "../../src/content/index";

// ─── Helpers ────────────────────────────────────────────────────────────────
function setLocationHref(url: string) {
  Object.defineProperty(window, "location", {
    value: { href: url },
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = "";
  // Remove any leftover root element
  document.getElementById("page-pulse-root")?.remove();

  // Default: regular https URL
  setLocationHref("https://example.com/article");

  // Reset mocks
  vi.clearAllMocks();

  // Ensure extension context is valid by default
  (chrome.runtime as Record<string, unknown>).id = "test-extension-id";

  // Re-apply default mock implementations after clearAllMocks
  vi.mocked(isDisabledSite).mockResolvedValue(false);
  vi.mocked(extractPageContent).mockReturnValue({
    url: "https://example.com/article",
    title: "Test Article",
    text: "This is the article body text.",
    readingTimeMinutes: 3,
  });
  mockAddListener.mockReset();
  mockSendMessage.mockReset();
  mockSendMessage.mockResolvedValue(undefined);
});

afterEach(() => {
  document.getElementById("page-pulse-root")?.remove();
});

// ─── URL filtering ───────────────────────────────────────────────────────────
describe("Content Script initialization", () => {
  describe("URL filtering", () => {
    it("does not inject badge on chrome:// URLs", async () => {
      setLocationHref("chrome://settings");
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not inject badge on chrome-extension:// URLs", async () => {
      setLocationHref("chrome-extension://abcdef/popup.html");
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not inject badge on about: URLs", async () => {
      setLocationHref("about:blank");
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not inject badge on edge:// URLs", async () => {
      setLocationHref("edge://settings");
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not inject badge on moz-extension:// URLs", async () => {
      setLocationHref("moz-extension://abcdef/popup.html");
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not inject badge when site is in disabled list", async () => {
      vi.mocked(isDisabledSite).mockResolvedValue(true);
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("injects badge on regular https:// URLs", async () => {
      await init();
      expect(document.getElementById("page-pulse-root")).not.toBeNull();
    });

    it("injects badge on regular http:// URLs", async () => {
      setLocationHref("http://example.com/page");
      await init();
      expect(document.getElementById("page-pulse-root")).not.toBeNull();
    });
  });

  // ─── Shadow DOM injection ────────────────────────────────────────────────
  describe("Shadow DOM injection", () => {
    it("creates host element with id 'page-pulse-root'", async () => {
      await init();
      const host = document.getElementById("page-pulse-root");
      expect(host).not.toBeNull();
    });

    it("appends host to document.body", async () => {
      await init();
      const host = document.getElementById("page-pulse-root");
      expect(host?.parentElement).toBe(document.body);
    });

    it("creates shadow root in closed mode (not accessible from outside)", async () => {
      await init();
      const host = document.getElementById("page-pulse-root");
      // closed mode: shadowRoot is NOT accessible from host-page scripts
      expect(host?.shadowRoot).toBeNull();
    });

    it("host element has z-index 2147483647", async () => {
      await init();
      const host = document.getElementById("page-pulse-root") as HTMLElement;
      expect(host.style.zIndex).toBe("2147483647");
    });

    it("host element is position fixed", async () => {
      await init();
      const host = document.getElementById("page-pulse-root") as HTMLElement;
      expect(host.style.position).toBe("fixed");
    });

    it("shadow root is inaccessible (closed mode prevents style inspection)", async () => {
      await init();
      const host = document.getElementById("page-pulse-root") as HTMLElement;
      // closed mode: external code cannot inspect adoptedStyleSheets
      expect(host.shadowRoot).toBeNull();
    });

    it("does not inject duplicate badge when called twice (idempotency)", async () => {
      await init();
      await init();
      const roots = document.querySelectorAll("#page-pulse-root");
      expect(roots).toHaveLength(1);
    });
  });

  // ─── null body guard ─────────────────────────────────────────────────────
  describe("null body guard", () => {
    it("does not throw when document.body is null", async () => {
      // Temporarily make body null
      const originalBody = document.body;
      Object.defineProperty(document, "body", {
        value: null,
        writable: true,
        configurable: true,
      });
      try {
        await expect(init()).resolves.not.toThrow();
      } finally {
        Object.defineProperty(document, "body", {
          value: originalBody,
          writable: true,
          configurable: true,
        });
      }
    });
  });

  // ─── Message listener ────────────────────────────────────────────────────
  describe("Message listener", () => {
    it("registers a chrome.runtime.onMessage listener", async () => {
      await init();
      expect(mockAddListener).toHaveBeenCalledTimes(1);
    });

    it("responds to GET_PAGE_CONTENT with extracted page data", async () => {
      await init();

      const registeredListener = mockAddListener.mock.calls[0][0] as (
        msg: unknown,
        sender: unknown,
        sendResponse: (v: unknown) => void
      ) => void;

      const sendResponse = vi.fn();
      registeredListener(
        { type: "GET_PAGE_CONTENT", tabId: 1 },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.any(String),
          title: expect.any(String),
          text: expect.any(String),
          readingTimeMinutes: expect.any(Number),
        })
      );
    });

    it("PageContentData contains url, title, text, readingTimeMinutes", async () => {
      await init();

      const registeredListener = mockAddListener.mock.calls[0][0] as (
        msg: unknown,
        sender: unknown,
        sendResponse: (v: unknown) => void
      ) => void;

      const sendResponse = vi.fn();
      registeredListener(
        { type: "GET_PAGE_CONTENT", tabId: 1 },
        {},
        sendResponse
      );

      const payload = sendResponse.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).toHaveProperty("url");
      expect(payload).toHaveProperty("title");
      expect(payload).toHaveProperty("text");
      expect(payload).toHaveProperty("readingTimeMinutes");
    });

    it("does not call sendResponse for unknown message types", async () => {
      await init();

      const registeredListener = mockAddListener.mock.calls[0][0] as (
        msg: unknown,
        sender: unknown,
        sendResponse: (v: unknown) => void
      ) => void;

      const sendResponse = vi.fn();
      registeredListener({ type: "UNKNOWN_MSG" }, {}, sendResponse);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  // ─── Badge click handler ─────────────────────────────────────────────────
  describe("Badge click handler", () => {
    it("sends OPEN_SIDE_PANEL message without tabId when badge is clicked", async () => {
      const BadgeMock = (await import("../../src/content/Badge.svelte"))
        .default as ReturnType<typeof vi.fn>;

      // Capture the onBadgeClick prop passed to Badge
      let capturedOnClick: (() => void) | undefined;
      BadgeMock.mockImplementationOnce((opts: { props: { onBadgeClick: () => void } }) => {
        capturedOnClick = opts.props.onBadgeClick;
        return { $destroy: vi.fn() };
      });

      await init();

      expect(capturedOnClick).toBeDefined();
      capturedOnClick!();

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: "OPEN_SIDE_PANEL",
      });
    });

    it("does not include tabId in OPEN_SIDE_PANEL message", async () => {
      const BadgeMock = (await import("../../src/content/Badge.svelte"))
        .default as ReturnType<typeof vi.fn>;

      let capturedOnClick: (() => void) | undefined;
      BadgeMock.mockImplementationOnce((opts: { props: { onBadgeClick: () => void } }) => {
        capturedOnClick = opts.props.onBadgeClick;
        return { $destroy: vi.fn() };
      });

      await init();
      capturedOnClick!();

      const call = mockSendMessage.mock.calls[0][0] as Record<string, unknown>;
      expect(call).not.toHaveProperty("tabId");
    });

    it("removes badge and does not throw when extension context is invalidated on click", async () => {
      const BadgeMock = (await import("../../src/content/Badge.svelte"))
        .default as ReturnType<typeof vi.fn>;

      let capturedOnClick: (() => void) | undefined;
      BadgeMock.mockImplementationOnce((opts: { props: { onBadgeClick: () => void } }) => {
        capturedOnClick = opts.props.onBadgeClick;
        return { $destroy: vi.fn() };
      });

      await init();
      expect(document.getElementById("page-pulse-root")).not.toBeNull();

      // Simulate extension context invalidated
      mockSendMessage.mockImplementation(() => {
        throw new Error("Extension context invalidated");
      });

      expect(() => capturedOnClick!()).not.toThrow();
      // Badge should be removed from DOM
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });
  });

  // ─── Extension context invalidation ─────────────────────────────────────
  describe("Extension context invalidation", () => {
    it("does not inject badge when chrome.runtime.id is undefined (stale context)", async () => {
      (chrome.runtime as Record<string, unknown>).id = undefined;
      await init();
      expect(document.getElementById("page-pulse-root")).toBeNull();
    });

    it("does not throw when chrome.runtime is inaccessible", async () => {
      const originalRuntime = chrome.runtime;
      Object.defineProperty(chrome, "runtime", {
        get() {
          throw new Error("Extension context invalidated");
        },
        configurable: true,
      });
      await expect(init()).resolves.not.toThrow();
      expect(document.getElementById("page-pulse-root")).toBeNull();
      // Restore
      Object.defineProperty(chrome, "runtime", {
        value: originalRuntime,
        writable: true,
        configurable: true,
      });
    });

    it("gracefully handles onMessage.addListener throwing", async () => {
      mockAddListener.mockImplementation(() => {
        throw new Error("Extension context invalidated");
      });
      // Should not throw — the badge should still be injected
      await expect(init()).resolves.not.toThrow();
      expect(document.getElementById("page-pulse-root")).not.toBeNull();
    });
  });
});

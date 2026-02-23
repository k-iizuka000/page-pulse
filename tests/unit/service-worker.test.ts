import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// vi.hoisted runs BEFORE both vi.mock factories and ESM imports.
// We use it to:
//   1. Assign globalThis.chrome so service-worker.ts can reference it at
//      module evaluation time (top-level chrome.runtime.onInstalled.addListener).
//   2. Expose mockHandleMessage for the vi.mock factory (closures over top-level
//      consts would still be in TDZ at hoist time).
const { mockHandleMessage, mockChrome } = vi.hoisted(() => {
  const mockHandleMessage = vi.fn(() => Promise.resolve({ success: true }));

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
        Promise.resolve({ url: "...", title: "...", text: "...", readingTimeMinutes: 3 })
      ),
    },
    storage: {
      local: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
      },
    },
  };

  // Assign before any module import executes
  (globalThis as any).chrome = mockChrome;

  return { mockHandleMessage, mockChrome };
});

vi.mock("$lib/messaging/handler", () => ({
  handleMessage: mockHandleMessage,
}));

// Importing service-worker.ts triggers its top-level side effects:
//   chrome.runtime.onInstalled.addListener(...)
//   chrome.runtime.onMessage.addListener(...)
import "../../src/background/service-worker";

// ── Capture listeners once at module-load time (before any clearAllMocks) ────

// Service-worker registers listeners synchronously at import time.
// We snapshot them here before beforeEach can wipe the mock call records.
let capturedInstalledListener: (() => void) | undefined;
let capturedMessageListener:
  | ((
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => boolean | void)
  | undefined;

beforeAll(() => {
  capturedInstalledListener =
    mockChrome.runtime.onInstalled.addListener.mock.calls[0]?.[0];
  capturedMessageListener =
    mockChrome.runtime.onMessage.addListener.mock.calls[0]?.[0];
});

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default after clearAllMocks resets the implementation
  mockHandleMessage.mockResolvedValue({ success: true });
});

describe("service-worker initialization", () => {
  it("registers an onMessage listener on startup", () => {
    expect(capturedMessageListener).toBeDefined();
  });

  it("registers an onInstalled listener on startup", () => {
    expect(capturedInstalledListener).toBeDefined();
  });

  it("calls setPanelBehavior with { openPanelOnActionClick: true } on install", () => {
    expect(capturedInstalledListener).toBeDefined();
    capturedInstalledListener!();
    expect(mockChrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it("onMessage listener returns true to keep the channel open for async response", () => {
    expect(capturedMessageListener).toBeDefined();

    const sendResponse = vi.fn();
    const returnValue = capturedMessageListener!(
      { type: "OPEN_SIDE_PANEL" },
      {},
      sendResponse
    );
    expect(returnValue).toBe(true);
  });

  it("onMessage listener calls sendResponse with the resolved handler result", async () => {
    mockHandleMessage.mockResolvedValueOnce({ success: true });

    expect(capturedMessageListener).toBeDefined();

    const sendResponse = vi.fn();
    capturedMessageListener!({ type: "OPEN_SIDE_PANEL" }, {}, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  it("onMessage listener calls sendResponse with an error object when handler rejects", async () => {
    mockHandleMessage.mockRejectedValueOnce(new Error("handler failed"));

    expect(capturedMessageListener).toBeDefined();

    const sendResponse = vi.fn();
    capturedMessageListener!({ type: "OPEN_SIDE_PANEL" }, {}, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ error: "handler failed" });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrCreateSession, destroySession } from "../../src/lib/ai/session";

const mockSession = {
  prompt: vi.fn(() =>
    Promise.resolve(
      JSON.stringify({
        summary: "Test summary",
        keyPoints: ["Point 1", "Point 2", "Point 3"],
        techLevel: "intermediate",
      })
    )
  ),
  promptStreaming: vi.fn(),
  destroy: vi.fn(),
};

const mockCreate = vi.fn(() => Promise.resolve(mockSession));

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  mockCreate.mockResolvedValue(mockSession);

  // Reset both namespaces
  Object.defineProperty(window, "ai", {
    value: undefined,
    writable: true,
    configurable: true,
  });

  // Set up global LanguageModel (Chrome 138+ style)
  (globalThis as Record<string, unknown>).LanguageModel = {
    capabilities: vi.fn(() => Promise.resolve({ available: "available" })),
    create: mockCreate,
  };

  // Always destroy session between tests to avoid singleton state leaking
  destroySession();
});

describe("getOrCreateSession", () => {
  it("creates a new session with system prompt", async () => {
    await getOrCreateSession();
    expect(mockCreate).toHaveBeenCalledOnce();
    const callArg = mockCreate.mock.calls[0][0] as { systemPrompt?: string };
    expect(callArg.systemPrompt).toBeDefined();
    expect(typeof callArg.systemPrompt).toBe("string");
    expect(callArg.systemPrompt!.length).toBeGreaterThan(0);
  });

  it("creates session with temperature 0.3", async () => {
    await getOrCreateSession();
    const callArg = mockCreate.mock.calls[0][0] as { temperature?: number };
    expect(callArg.temperature).toBe(0.3);
  });

  it("creates session with topK 3", async () => {
    await getOrCreateSession();
    const callArg = mockCreate.mock.calls[0][0] as { topK?: number };
    expect(callArg.topK).toBe(3);
  });

  it("returns same session on subsequent calls (singleton)", async () => {
    const session1 = await getOrCreateSession();
    const session2 = await getOrCreateSession();
    expect(session1).toBe(session2);
    // create should only have been called once across two calls
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("creates new session after destroySession()", async () => {
    await getOrCreateSession();
    expect(mockCreate).toHaveBeenCalledTimes(1);

    destroySession();

    await getOrCreateSession();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws when no LanguageModel API is available", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = undefined;
    Object.defineProperty(window, "ai", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(getOrCreateSession()).rejects.toThrow(
      "LanguageModel API is not available."
    );
  });

  it("falls back to window.ai.languageModel when global LanguageModel is undefined", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = undefined;
    Object.defineProperty(window, "ai", {
      value: {
        languageModel: {
          capabilities: vi.fn(() => Promise.resolve({ available: "available" })),
          create: mockCreate,
        },
      },
      writable: true,
      configurable: true,
    });

    await getOrCreateSession();
    expect(mockCreate).toHaveBeenCalledOnce();
  });
});

describe("destroySession", () => {
  it("calls destroy() on the current session", async () => {
    await getOrCreateSession();
    // Clear any previous calls from beforeEach cleanup
    mockSession.destroy.mockClear();
    destroySession();
    expect(mockSession.destroy).toHaveBeenCalledOnce();
  });

  it("clears the cached session reference — getOrCreateSession creates a new session after destroySession", async () => {
    const firstSession = await getOrCreateSession();
    destroySession();

    const newMockSession = { ...mockSession, destroy: vi.fn() };
    mockCreate.mockResolvedValueOnce(newMockSession);

    const secondSession = await getOrCreateSession();
    expect(secondSession).toBe(newMockSession);
    expect(firstSession).not.toBe(secondSession);
  });

  it("does nothing if no session exists", () => {
    // destroySession called in beforeEach already cleared state
    // Calling again should not throw
    expect(() => destroySession()).not.toThrow();
  });
});

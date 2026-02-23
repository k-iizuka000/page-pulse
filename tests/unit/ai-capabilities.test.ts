import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkAIAvailability,
  getLanguageModelFactory,
} from "../../src/lib/ai/capabilities";

describe("checkAIAvailability", () => {
  beforeEach(() => {
    Object.defineProperty(window, "ai", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    (globalThis as Record<string, unknown>).LanguageModel = undefined;
  });

  it("returns 'unavailable' when neither LanguageModel nor window.ai exist", async () => {
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });

  it("returns 'unavailable' when window.ai exists but languageModel is undefined", async () => {
    Object.defineProperty(window, "ai", {
      value: {},
      writable: true,
      configurable: true,
    });
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });

  // --- New API: LanguageModel.availability() returns string directly ---

  it("returns 'available' via global LanguageModel.availability() (new API)", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("available");
  });

  it("returns 'downloadable' via LanguageModel.availability()", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("downloadable");
  });

  it("returns 'downloading' via LanguageModel.availability()", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: vi.fn(() => Promise.resolve("downloading")),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("downloading");
  });

  it("returns 'unavailable' via LanguageModel.availability()", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: vi.fn(() => Promise.resolve("unavailable")),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });

  it("prefers availability() over capabilities()", async () => {
    const availabilityFn = vi.fn(() => Promise.resolve("available"));
    const capabilitiesFn = vi.fn(() =>
      Promise.resolve({ available: "unavailable" })
    );
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: availabilityFn,
      capabilities: capabilitiesFn,
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("available");
    expect(availabilityFn).toHaveBeenCalledOnce();
    expect(capabilitiesFn).not.toHaveBeenCalled();
  });

  // --- Legacy API: capabilities().available ---

  it("returns 'available' via capabilities() fallback (legacy)", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      capabilities: vi.fn(() => Promise.resolve({ available: "available" })),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("available");
  });

  it("returns 'available' via window.ai.languageModel (legacy)", async () => {
    Object.defineProperty(window, "ai", {
      value: {
        languageModel: {
          capabilities: vi.fn(() =>
            Promise.resolve({ available: "available" })
          ),
          create: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });
    const result = await checkAIAvailability();
    expect(result).toBe("available");
  });

  it("prefers global LanguageModel over window.ai.languageModel", async () => {
    const globalAvailability = vi.fn(() => Promise.resolve("available"));
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: globalAvailability,
      create: vi.fn(),
    };
    Object.defineProperty(window, "ai", {
      value: {
        languageModel: {
          capabilities: vi.fn(() =>
            Promise.resolve({ available: "unavailable" })
          ),
          create: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });
    const result = await checkAIAvailability();
    expect(result).toBe("available");
  });

  // --- Error handling ---

  it("returns 'unavailable' when availability() throws", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      availability: vi.fn(() => Promise.reject(new Error("failed"))),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });

  it("returns 'unavailable' when capabilities() throws", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      capabilities: vi.fn(() => Promise.reject(new Error("failed"))),
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });

  it("returns 'unavailable' when factory has neither availability nor capabilities", async () => {
    (globalThis as Record<string, unknown>).LanguageModel = {
      create: vi.fn(),
    };
    const result = await checkAIAvailability();
    expect(result).toBe("unavailable");
  });
});

describe("getLanguageModelFactory", () => {
  beforeEach(() => {
    Object.defineProperty(window, "ai", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    (globalThis as Record<string, unknown>).LanguageModel = undefined;
  });

  it("returns undefined when no API exists", () => {
    expect(getLanguageModelFactory()).toBeUndefined();
  });

  it("returns global LanguageModel when available", () => {
    const factory = { availability: vi.fn(), create: vi.fn() };
    (globalThis as Record<string, unknown>).LanguageModel = factory;
    expect(getLanguageModelFactory()).toBe(factory);
  });

  it("falls back to window.ai.languageModel", () => {
    const factory = { capabilities: vi.fn(), create: vi.fn() };
    Object.defineProperty(window, "ai", {
      value: { languageModel: factory },
      writable: true,
      configurable: true,
    });
    expect(getLanguageModelFactory()).toBe(factory);
  });
});

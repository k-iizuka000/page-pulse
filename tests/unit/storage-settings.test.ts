import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSettings,
  updateSettings,
  isDisabledSite,
} from "../../src/lib/storage/settings";
import { DEFAULT_SETTINGS } from "../../src/lib/storage/types";

// In-memory chrome.storage.local mock
const store = new Map<string, unknown>();

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === "string") {
          return Promise.resolve({ [keys]: store.get(keys) });
        }
        const result: Record<string, unknown> = {};
        (Array.isArray(keys) ? keys : Object.keys(keys)).forEach((k) => {
          if (store.has(k)) result[k] = store.get(k);
        });
        return Promise.resolve(result);
      }),
      set: vi.fn((items) => {
        Object.entries(items).forEach(([k, v]) => store.set(k, v));
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        (Array.isArray(keys) ? keys : [keys]).forEach((k) =>
          store.delete(k)
        );
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
  },
} as any;

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe("getSettings", () => {
  it("returns DEFAULT_SETTINGS when storage is empty", async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns stored settings when present", async () => {
    const stored = {
      autoSummarize: false,
      disabledSites: ["example.com"],
      theme: "dark" as const,
      language: "en" as const,
    };
    store.set("settings", stored);
    const settings = await getSettings();
    expect(settings).toEqual(stored);
  });

  it("merges partial stored settings with defaults", async () => {
    // Only theme is stored
    store.set("settings", { theme: "light" });
    const settings = await getSettings();
    expect(settings.theme).toBe("light");
    expect(settings.autoSummarize).toBe(DEFAULT_SETTINGS.autoSummarize);
    expect(settings.disabledSites).toEqual(DEFAULT_SETTINGS.disabledSites);
  });
});

describe("updateSettings", () => {
  it("updates a single field", async () => {
    await updateSettings({ autoSummarize: false });
    const settings = await getSettings();
    expect(settings.autoSummarize).toBe(false);
  });

  it("preserves other fields when updating one", async () => {
    // Start with a known state
    store.set("settings", {
      autoSummarize: true,
      disabledSites: ["site.com"],
      theme: "dark",
    });
    await updateSettings({ autoSummarize: false });
    const settings = await getSettings();
    expect(settings.disabledSites).toEqual(["site.com"]);
    expect(settings.theme).toBe("dark");
    expect(settings.autoSummarize).toBe(false);
  });

  it("updates multiple fields at once", async () => {
    await updateSettings({ autoSummarize: false, theme: "light" });
    const settings = await getSettings();
    expect(settings.autoSummarize).toBe(false);
    expect(settings.theme).toBe("light");
  });
});

describe("isDisabledSite", () => {
  it("returns false for empty disabledSites list", async () => {
    const result = await isDisabledSite("https://example.com/page");
    expect(result).toBe(false);
  });

  it("returns true for exact hostname match in disabledSites", async () => {
    store.set("settings", {
      ...DEFAULT_SETTINGS,
      disabledSites: ["example.com"],
    });
    const result = await isDisabledSite("https://example.com/page");
    expect(result).toBe(true);
  });

  it("returns false for non-matching site", async () => {
    store.set("settings", {
      ...DEFAULT_SETTINGS,
      disabledSites: ["other.com"],
    });
    const result = await isDisabledSite("https://example.com/page");
    expect(result).toBe(false);
  });

  it("matches hostname regardless of path", async () => {
    store.set("settings", {
      ...DEFAULT_SETTINGS,
      disabledSites: ["example.com"],
    });
    const result = await isDisabledSite("https://example.com/a/b/c?q=1");
    expect(result).toBe(true);
  });
});

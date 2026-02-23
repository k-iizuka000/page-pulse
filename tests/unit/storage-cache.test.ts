import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCachedSummary,
  cacheSummary,
  clearCache,
} from "../../src/lib/storage/cache";
import type { SummaryData } from "../../src/lib/messaging/types";
import { CACHE_MAX_SIZE } from "../../src/lib/storage/types";

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

afterEach(() => {
  // Restore real timers if a test installed fake ones.
  vi.useRealTimers();
});

function makeSummary(overrides: Partial<SummaryData> = {}): SummaryData {
  return {
    summary: "A summary",
    keyPoints: ["Point 1", "Point 2", "Point 3"],
    techLevel: "beginner",
    readingTimeMinutes: 3,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("getCachedSummary", () => {
  it("returns null when cache is empty", async () => {
    const result = await getCachedSummary("https://example.com");
    expect(result).toBeNull();
  });

  it("returns null when URL not found", async () => {
    await cacheSummary("https://other.com", makeSummary());
    const result = await getCachedSummary("https://example.com");
    expect(result).toBeNull();
  });

  it("returns cached summary for matching URL", async () => {
    const summary = makeSummary({ summary: "My cached summary" });
    await cacheSummary("https://example.com", summary);
    const result = await getCachedSummary("https://example.com");
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("My cached summary");
  });
});

describe("cacheSummary", () => {
  it("stores a new summary and makes it retrievable", async () => {
    const summary = makeSummary({ summary: "Stored summary" });
    await cacheSummary("https://example.com/page", summary);
    const result = await getCachedSummary("https://example.com/page");
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("Stored summary");
  });

  it("overwrites existing summary for same URL", async () => {
    const original = makeSummary({ summary: "Original" });
    const updated = makeSummary({ summary: "Updated" });
    await cacheSummary("https://example.com", original);
    await cacheSummary("https://example.com", updated);
    const result = await getCachedSummary("https://example.com");
    expect(result!.summary).toBe("Updated");
  });

  it("records write-time as cache entry timestamp, not summary.timestamp", async () => {
    vi.useFakeTimers();

    // First write at T=1000
    vi.setSystemTime(1000);
    await cacheSummary("https://example.com", makeSummary({ timestamp: 0 }));

    // Second write at T=5000 — the cache entry timestamp must reflect T=5000
    vi.setSystemTime(5000);
    await cacheSummary("https://example.com", makeSummary({ timestamp: 0 }));

    // Inspect the raw store entry
    const raw = store.get("summaryCache") as Record<
      string,
      { summary: SummaryData; timestamp: number }
    >;
    expect(raw["https://example.com"].timestamp).toBe(5000);
  });

  it("evicts oldest entry when cache reaches 100", async () => {
    vi.useFakeTimers();

    // Fill cache to CACHE_MAX_SIZE; each write is 1 ms apart so T=1 is oldest.
    for (let i = 1; i <= CACHE_MAX_SIZE; i++) {
      vi.setSystemTime(i);
      await cacheSummary(`https://example.com/page-${i}`, makeSummary());
    }

    // 101st insert — the entry cached at T=1 (page-1) must be evicted.
    vi.setSystemTime(CACHE_MAX_SIZE + 1);
    await cacheSummary("https://example.com/page-new", makeSummary());

    const evicted = await getCachedSummary("https://example.com/page-1");
    expect(evicted).toBeNull();

    const present = await getCachedSummary("https://example.com/page-new");
    expect(present).not.toBeNull();
  });

  it("evicts correct entry (oldest write-time)", async () => {
    vi.useFakeTimers();

    // Insert three entries with intentionally non-sequential write times.
    vi.setSystemTime(500);
    await cacheSummary("https://a.com", makeSummary());

    vi.setSystemTime(100); // <- oldest write-time, must be evicted
    await cacheSummary("https://b.com", makeSummary());

    vi.setSystemTime(300);
    await cacheSummary("https://c.com", makeSummary());

    // Fill the remaining slots at times > 300 so b.com stays the oldest.
    for (let i = 4; i <= CACHE_MAX_SIZE; i++) {
      vi.setSystemTime(1000 + i);
      await cacheSummary(`https://fill-${i}.com`, makeSummary());
    }

    // 101st insert — b.com (T=100) must be evicted.
    vi.setSystemTime(9999);
    await cacheSummary("https://new.com", makeSummary());

    const evicted = await getCachedSummary("https://b.com");
    expect(evicted).toBeNull();

    const survived = await getCachedSummary("https://a.com");
    expect(survived).not.toBeNull();
  });

  it("maintains max 100 entries after multiple writes", async () => {
    vi.useFakeTimers();

    for (let i = 1; i <= 110; i++) {
      vi.setSystemTime(i);
      await cacheSummary(`https://example.com/page-${i}`, makeSummary());
    }

    const raw = store.get("summaryCache") as Record<string, unknown>;
    expect(Object.keys(raw).length).toBeLessThanOrEqual(CACHE_MAX_SIZE);
  });
});

describe("clearCache", () => {
  it("removes all cached entries", async () => {
    await cacheSummary("https://a.com", makeSummary());
    await cacheSummary("https://b.com", makeSummary());
    await clearCache();
    const a = await getCachedSummary("https://a.com");
    const b = await getCachedSummary("https://b.com");
    expect(a).toBeNull();
    expect(b).toBeNull();
  });
});

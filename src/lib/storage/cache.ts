import { CACHE_MAX_SIZE, STORAGE_KEYS } from "./types";
import type { SummaryData } from "../messaging/types";

/** Internal shape stored under STORAGE_KEYS.SUMMARY_CACHE. */
type CacheStore = Record<string, { summary: SummaryData; timestamp: number }>;

async function readCache(): Promise<CacheStore> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SUMMARY_CACHE);
  return (result[STORAGE_KEYS.SUMMARY_CACHE] as CacheStore) ?? {};
}

async function writeCache(cache: CacheStore): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SUMMARY_CACHE]: cache });
}

/**
 * Returns the cached SummaryData for the given URL, or null if not present.
 */
export async function getCachedSummary(url: string): Promise<SummaryData | null> {
  const cache = await readCache();
  const entry = cache[url];
  return entry ? entry.summary : null;
}

/**
 * Stores a summary for the given URL. If the cache would exceed CACHE_MAX_SIZE
 * after insertion, the entry with the oldest timestamp is evicted first.
 */
export async function cacheSummary(url: string, summary: SummaryData): Promise<void> {
  const cache = await readCache();

  // If this URL is already cached it's an update — not a new entry.
  const isUpdate = url in cache;

  if (!isUpdate && Object.keys(cache).length >= CACHE_MAX_SIZE) {
    // Evict the entry with the smallest (oldest) timestamp.
    let oldestUrl = "";
    let oldestTimestamp = Infinity;
    for (const [entryUrl, entry] of Object.entries(cache)) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestUrl = entryUrl;
      }
    }
    delete cache[oldestUrl];
  }

  // Use write-time so eviction order reflects when entries were actually
  // cached, not when the summary was originally generated.
  cache[url] = { summary, timestamp: Date.now() };
  await writeCache(cache);
}

/**
 * Removes all cached summaries.
 */
export async function clearCache(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.SUMMARY_CACHE);
}

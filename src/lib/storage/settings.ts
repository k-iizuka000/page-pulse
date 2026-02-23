import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./types";
import type { Settings } from "./types";

/**
 * Reads settings from chrome.storage.local, merging with defaults for any
 * missing fields.
 */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const stored = (result[STORAGE_KEYS.SETTINGS] as Partial<Settings>) ?? {};
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Merges a partial settings update with the currently stored settings and
 * writes the result back to chrome.storage.local.
 */
export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated: Settings = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
}

/**
 * Returns true when the hostname of the given URL appears in the
 * disabledSites list.
 */
export async function isDisabledSite(url: string): Promise<boolean> {
  const settings = await getSettings();
  const hostname = new URL(url).hostname;
  return settings.disabledSites.includes(hostname);
}

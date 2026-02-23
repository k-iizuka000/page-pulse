import type { SummaryData } from "../messaging/types";

export type Language = "en" | "ja";

export interface Settings {
  autoSummarize: boolean;
  disabledSites: string[];
  theme: "light" | "dark" | "auto";
  language: Language;
}

export const DEFAULT_SETTINGS: Settings = {
  autoSummarize: true,
  disabledSites: [],
  theme: "auto",
  language: "ja",
};

export interface SummaryCacheEntry {
  url: string;
  summary: SummaryData;
  timestamp: number;
}

export const CACHE_MAX_SIZE = 100;

/** Storage key constants */
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  SUMMARY_CACHE: "summaryCache",
} as const;

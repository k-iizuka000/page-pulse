import { describe, it, expect } from "vitest";
import type { Message, PageContentData, SummaryData } from "../../src/lib/messaging/types";

describe("Message type guards", () => {
  it("discriminates GET_PAGE_CONTENT by type field", () => {
    const msg: Message = { type: "GET_PAGE_CONTENT", tabId: 42 };
    expect(msg.type).toBe("GET_PAGE_CONTENT");
    if (msg.type === "GET_PAGE_CONTENT") {
      expect(msg.tabId).toBe(42);
    }
  });

  it("discriminates OPEN_SIDE_PANEL by type field with optional tabId", () => {
    const msgWithTab: Message = { type: "OPEN_SIDE_PANEL", tabId: 5 };
    expect(msgWithTab.type).toBe("OPEN_SIDE_PANEL");

    const msgWithoutTab: Message = { type: "OPEN_SIDE_PANEL" };
    expect(msgWithoutTab.type).toBe("OPEN_SIDE_PANEL");
    if (msgWithoutTab.type === "OPEN_SIDE_PANEL") {
      expect(msgWithoutTab.tabId).toBeUndefined();
    }
  });

  it("discriminates GET_CACHED_SUMMARY by type field", () => {
    const msg: Message = {
      type: "GET_CACHED_SUMMARY",
      url: "https://example.com",
    };
    expect(msg.type).toBe("GET_CACHED_SUMMARY");
    if (msg.type === "GET_CACHED_SUMMARY") {
      expect(msg.url).toBe("https://example.com");
    }
  });

  it("discriminates CACHE_SUMMARY by type field", () => {
    const summary: SummaryData = {
      summary: "A summary",
      keyPoints: ["p1", "p2", "p3"],
      techLevel: "beginner",
      readingTimeMinutes: 2,
      timestamp: 12345,
    };
    const msg: Message = {
      type: "CACHE_SUMMARY",
      url: "https://example.com",
      summary,
    };
    expect(msg.type).toBe("CACHE_SUMMARY");
    if (msg.type === "CACHE_SUMMARY") {
      expect(msg.url).toBe("https://example.com");
      expect(msg.summary).toEqual(summary);
    }
  });

  it("PageContentData has required fields", () => {
    const data: PageContentData = {
      url: "https://example.com",
      title: "Test",
      text: "Content here",
      readingTimeMinutes: 1,
    };
    expect(data.url).toBe("https://example.com");
    expect(data.title).toBe("Test");
    expect(data.text).toBe("Content here");
    expect(data.readingTimeMinutes).toBe(1);
  });

  it("SummaryData has required fields", () => {
    const data: SummaryData = {
      summary: "Summary text",
      keyPoints: ["k1", "k2", "k3"],
      techLevel: "intermediate",
      readingTimeMinutes: 4,
      timestamp: 999,
    };
    expect(data.summary).toBe("Summary text");
    expect(data.keyPoints).toHaveLength(3);
    expect(data.techLevel).toBe("intermediate");
    expect(data.readingTimeMinutes).toBe(4);
    expect(data.timestamp).toBe(999);
  });

  it("SummaryData.keyPoints is exactly 3 items", () => {
    const data: SummaryData = {
      summary: "S",
      keyPoints: ["a", "b", "c"],
      techLevel: "advanced",
      readingTimeMinutes: 1,
      timestamp: 0,
    };
    expect(data.keyPoints).toHaveLength(3);
    expect(data.keyPoints[0]).toBe("a");
    expect(data.keyPoints[1]).toBe("b");
    expect(data.keyPoints[2]).toBe("c");
  });

  it("SummaryData.techLevel is one of allowed values", () => {
    const levels: Array<SummaryData["techLevel"]> = [
      "beginner",
      "intermediate",
      "advanced",
    ];
    levels.forEach((level) => {
      const data: SummaryData = {
        summary: "S",
        keyPoints: ["a", "b", "c"],
        techLevel: level,
        readingTimeMinutes: 1,
        timestamp: 0,
      };
      expect(["beginner", "intermediate", "advanced"]).toContain(
        data.techLevel
      );
    });
  });
});

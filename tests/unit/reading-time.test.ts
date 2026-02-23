import { describe, it, expect } from "vitest";
import { calculateReadingTime } from "../../src/lib/utils/reading-time";

describe("calculateReadingTime", () => {
  it("returns 1 minute for empty string", () => {
    expect(calculateReadingTime("")).toBe(1);
  });

  it("returns 1 minute for whitespace-only string", () => {
    expect(calculateReadingTime("   \n\t  ")).toBe(1);
  });

  it("returns 1 minute for text under 200 words", () => {
    const words = Array(100).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(1);
  });

  it("returns 1 minute for exactly 200 words", () => {
    const words = Array(200).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(1);
  });

  it("returns 2 minutes for 201 words", () => {
    const words = Array(201).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("returns 2 minutes for 400 words", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("returns 5 minutes for 1000 words", () => {
    const words = Array(1000).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(5);
  });

  it("counts words correctly with multiple spaces", () => {
    // 4 words with extra spaces => 1 minute
    const text = "one   two   three   four";
    expect(calculateReadingTime(text)).toBe(1);
  });

  it("counts words correctly with newlines and tabs", () => {
    const text = "one\ntwo\tthree\nfour";
    expect(calculateReadingTime(text)).toBe(1);
  });

  it("uses custom WPM when provided", () => {
    // 100 words at 50 WPM => ceil(100/50) = 2
    const words = Array(100).fill("word").join(" ");
    expect(calculateReadingTime(words, 50)).toBe(2);
  });

  it("returns 1 minute for 1 word", () => {
    expect(calculateReadingTime("hello")).toBe(1);
  });

  it("returns 1 minute for 199 words", () => {
    const words = Array(199).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(1);
  });

  it("returns 50 minutes for 10000 words", () => {
    const words = Array(10000).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(50);
  });
});

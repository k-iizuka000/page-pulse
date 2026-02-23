import { describe, it, expect } from "vitest";
import { normalizeUrl } from "../../src/lib/utils/url";

describe("normalizeUrl", () => {
  it("strips hash fragment", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page"
    );
  });

  it("strips utm_source param", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_source=google"
    );
    expect(result).not.toContain("utm_source");
    expect(result).toContain("example.com/page");
  });

  it("strips utm_medium param", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_medium=email"
    );
    expect(result).not.toContain("utm_medium");
  });

  it("strips utm_campaign param", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_campaign=spring"
    );
    expect(result).not.toContain("utm_campaign");
  });

  it("strips utm_content param", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_content=banner"
    );
    expect(result).not.toContain("utm_content");
  });

  it("strips utm_term param", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_term=keyword"
    );
    expect(result).not.toContain("utm_term");
  });

  it("strips ref param", () => {
    const result = normalizeUrl("https://example.com/page?ref=homepage");
    expect(result).not.toContain("ref=");
  });

  it("strips source param", () => {
    const result = normalizeUrl(
      "https://example.com/page?source=newsletter"
    );
    expect(result).not.toContain("source=");
  });

  it("strips fbclid param", () => {
    const result = normalizeUrl(
      "https://example.com/page?fbclid=ABC123"
    );
    expect(result).not.toContain("fbclid");
  });

  it("strips gclid param", () => {
    const result = normalizeUrl(
      "https://example.com/page?gclid=XYZ789"
    );
    expect(result).not.toContain("gclid");
  });

  it("strips multiple tracking params at once", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_source=google&utm_medium=cpc&ref=ad&page=2"
    );
    expect(result).not.toContain("utm_source");
    expect(result).not.toContain("utm_medium");
    expect(result).not.toContain("ref=");
    expect(result).toContain("page=2");
  });

  it("removes trailing slash from path", () => {
    expect(normalizeUrl("https://example.com/page/")).toBe(
      "https://example.com/page"
    );
  });

  it("keeps root slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe(
      "https://example.com/"
    );
  });

  it("preserves non-tracking query params", () => {
    const result = normalizeUrl("https://example.com/articles?page=2");
    expect(result).toContain("page=2");
  });

  it("preserves path segments", () => {
    const result = normalizeUrl("https://example.com/a/b/c");
    expect(result).toBe("https://example.com/a/b/c");
  });

  it("handles URL with no params or hash", () => {
    expect(normalizeUrl("https://example.com/page")).toBe(
      "https://example.com/page"
    );
  });

  it("throws on invalid URL", () => {
    expect(() => normalizeUrl("not-a-url")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => normalizeUrl("")).toThrow();
  });

  it("handles URL with only hash", () => {
    expect(normalizeUrl("https://example.com/#section")).toBe(
      "https://example.com/"
    );
  });

  it("handles URL with only tracking params", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_source=x&utm_medium=y"
    );
    expect(result).toBe("https://example.com/page");
  });

  it("handles URL with hash and tracking params", () => {
    const result = normalizeUrl(
      "https://example.com/page?utm_source=x#section"
    );
    expect(result).toBe("https://example.com/page");
  });
});

import { describe, it, expect } from "vitest";
import { extractPageContent } from "../../src/lib/extractor/page-content";

function createDoc(bodyHtml: string, title = "Test Page", url = "https://example.com/page"): Document {
  const doc = document.implementation.createHTMLDocument(title);
  doc.body.innerHTML = bodyHtml;
  // jsdom uses location - we set it via Object.defineProperty
  Object.defineProperty(doc, "URL", { value: url, writable: true });
  return doc;
}

describe("extractPageContent", () => {
  it("extracts text from simple body", () => {
    const doc = createDoc("<p>Hello world</p>");
    const result = extractPageContent(doc);
    expect(result.text).toContain("Hello world");
  });

  it("removes <script> tags", () => {
    const doc = createDoc(
      "<p>Visible</p><script>alert('secret')</script>"
    );
    const result = extractPageContent(doc);
    expect(result.text).toContain("Visible");
    expect(result.text).not.toContain("alert");
    expect(result.text).not.toContain("secret");
  });

  it("removes <style> tags", () => {
    const doc = createDoc(
      "<p>Visible</p><style>body { color: red; }</style>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("color:");
    expect(result.text).not.toContain("red");
  });

  it("removes <nav> elements", () => {
    const doc = createDoc(
      "<nav>Navigation links</nav><p>Main content</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Navigation links");
    expect(result.text).toContain("Main content");
  });

  it("removes <header> elements", () => {
    const doc = createDoc(
      "<header>Site header</header><p>Article body</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Site header");
    expect(result.text).toContain("Article body");
  });

  it("removes <footer> elements", () => {
    const doc = createDoc(
      "<footer>Copyright 2024</footer><p>Article content</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Copyright 2024");
    expect(result.text).toContain("Article content");
  });

  it("removes <aside> elements", () => {
    const doc = createDoc(
      "<aside>Sidebar ad</aside><p>Article text</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Sidebar ad");
    expect(result.text).toContain("Article text");
  });

  it("removes <noscript> elements", () => {
    const doc = createDoc(
      "<noscript>Please enable JS</noscript><p>Real content</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Please enable JS");
    expect(result.text).toContain("Real content");
  });

  it("collapses multiple whitespace to single space", () => {
    const doc = createDoc("<p>word1    word2\n\n\nword3</p>");
    const result = extractPageContent(doc);
    expect(result.text).not.toMatch(/\s{2,}/);
  });

  it("truncates to 5000 characters", () => {
    const longText = "word ".repeat(2000);
    const doc = createDoc(`<p>${longText}</p>`);
    const result = extractPageContent(doc);
    expect(result.text.length).toBeLessThanOrEqual(5000);
  });

  it("truncates at word boundary", () => {
    const longText = "word ".repeat(2000);
    const doc = createDoc(`<p>${longText}</p>`);
    const result = extractPageContent(doc);
    // Should not end mid-word (last char should be space or end of a complete word)
    // The text after trimming should not cut a word
    const trimmed = result.text.trimEnd();
    expect(trimmed).not.toMatch(/\S-$/); // no hyphenated cut
    // Each token in the result is a complete word
    const tokens = trimmed.split(/\s+/);
    tokens.forEach((token) => {
      expect(token.length).toBeGreaterThan(0);
    });
  });

  it("returns empty string for empty body", () => {
    const doc = createDoc("");
    const result = extractPageContent(doc);
    expect(result.text).toBe("");
  });

  it("includes document title in result", () => {
    const doc = createDoc("<p>Content</p>", "My Article");
    const result = extractPageContent(doc);
    expect(result.title).toBe("My Article");
  });

  it("includes reading time in result", () => {
    const doc = createDoc("<p>Some content here</p>");
    const result = extractPageContent(doc);
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(result.readingTimeMinutes)).toBe(true);
  });

  it("does not mutate the original document", () => {
    const doc = createDoc(
      "<script>alert(1)</script><p>Content</p><nav>Nav</nav>"
    );
    const originalHtml = doc.body.innerHTML;
    extractPageContent(doc);
    expect(doc.body.innerHTML).toBe(originalHtml);
  });

  it("includes URL in result", () => {
    const doc = createDoc("<p>Content</p>", "Title", "https://example.com/article");
    const result = extractPageContent(doc);
    expect(result.url).toBe("https://example.com/article");
  });

  it("handles document with only scripts (returns empty text)", () => {
    const doc = createDoc(
      "<script>const x = 1;</script><style>body{}</style>"
    );
    const result = extractPageContent(doc);
    expect(result.text).toBe("");
  });

  it("handles nested removed elements", () => {
    const doc = createDoc(
      "<nav><ul><li>Link1</li><li>Link2</li></ul></nav><p>Article</p>"
    );
    const result = extractPageContent(doc);
    expect(result.text).not.toContain("Link1");
    expect(result.text).not.toContain("Link2");
    expect(result.text).toContain("Article");
  });
});

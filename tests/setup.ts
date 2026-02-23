/**
 * Global Vitest setup file.
 *
 * Polyfills browser APIs that jsdom does not implement but that the
 * source code relies on (e.g. CSSStyleSheet.replaceSync,
 * ShadowRoot.adoptedStyleSheets).
 *
 * This file is loaded once per test environment before any test module is
 * imported, so the polyfills are available when module-level code runs.
 */
import { vi } from "vitest";

// ── CSSStyleSheet polyfill ───────────────────────────────────────────────────
// jsdom does not support the Constructable Stylesheets spec
// (new CSSStyleSheet() / replaceSync / adoptedStyleSheets).
// We provide a minimal mock so content-script tests do not throw.

class MockCSSStyleSheet {
  replaceSync = vi.fn();
}

// Only install the polyfill when the native constructor is absent or
// lacks replaceSync. Wrapping in try-catch guards against environments
// where the CSSStyleSheet constructor itself throws.
let needsPolyfill = true;
try {
  const sheet = new CSSStyleSheet();
  if (typeof sheet.replaceSync === "function") {
    needsPolyfill = false;
  }
} catch {
  // Constructor threw — polyfill is required.
}
if (needsPolyfill) {
  (globalThis as unknown as Record<string, unknown>).CSSStyleSheet =
    MockCSSStyleSheet;
}

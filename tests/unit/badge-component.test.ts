/**
 * Tests for src/content/Badge.svelte
 *
 * Uses @testing-library/svelte to render the component into jsdom and
 * verify rendering, accessibility, and interaction behaviour.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import Badge from "../../src/content/Badge.svelte";

beforeEach(() => {
  cleanup();
});

// ─── Rendering ──────────────────────────────────────────────────────────────
describe("Badge component", () => {
  describe("rendering", () => {
    it("renders as a <button> element", () => {
      const { container } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = container.querySelector("button");
      expect(button).not.toBeNull();
    });

    it("renders reading time in ready state", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("3 min");
    });

    it("renders reading time in loading state", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 5, state: "loading", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("5 min");
    });

    it("renders pulse animation class in loading state", () => {
      const { container } = render(Badge, {
        props: { readingTime: 3, state: "loading", onBadgeClick: vi.fn() },
      });
      const button = container.querySelector("button");
      expect(button?.className).toContain("badge--loading");
    });

    it("renders warning icon text in setup-needed state", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "setup-needed", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("Setup");
    });

    it("renders badge--setup-needed class in setup-needed state", () => {
      const { container } = render(Badge, {
        props: { readingTime: 3, state: "setup-needed", onBadgeClick: vi.fn() },
      });
      const button = container.querySelector("button");
      expect(button?.className).toContain("badge--setup-needed");
    });

    it("renders error text in error state", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "error", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("Error");
    });

    it("renders badge--error class in error state", () => {
      const { container } = render(Badge, {
        props: { readingTime: 3, state: "error", onBadgeClick: vi.fn() },
      });
      const button = container.querySelector("button");
      expect(button?.className).toContain("badge--error");
    });

    it("has accessible aria-label with reading time", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.getAttribute("aria-label")).toContain("3 min read");
    });

    it("aria-label mentions Page Pulse brand name", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 7, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.getAttribute("aria-label")).toContain("Page Pulse");
    });

    it("renders minimum reading time (1 min)", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 1, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("1 min");
    });

    it("renders large reading time (99 min)", () => {
      const { getByRole } = render(Badge, {
        props: { readingTime: 99, state: "ready", onBadgeClick: vi.fn() },
      });
      const button = getByRole("button");
      expect(button.textContent).toContain("99 min");
    });
  });

  // ─── Interaction ─────────────────────────────────────────────────────────
  describe("interaction", () => {
    it("calls onBadgeClick when clicked", async () => {
      const onBadgeClick = vi.fn();
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick },
      });
      await fireEvent.click(getByRole("button"));
      expect(onBadgeClick).toHaveBeenCalled();
    });

    it("calls onBadgeClick exactly once per single click", async () => {
      const onBadgeClick = vi.fn();
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick },
      });
      await fireEvent.click(getByRole("button"));
      expect(onBadgeClick).toHaveBeenCalledTimes(1);
    });

    it("calls onBadgeClick on each separate click", async () => {
      const onBadgeClick = vi.fn();
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready", onBadgeClick },
      });
      const button = getByRole("button");
      await fireEvent.click(button);
      await fireEvent.click(button);
      expect(onBadgeClick).toHaveBeenCalledTimes(2);
    });

    it("works without providing onBadgeClick (default no-op)", async () => {
      // No onBadgeClick prop — default should be a no-op
      const { getByRole } = render(Badge, {
        props: { readingTime: 3, state: "ready" },
      });
      await expect(fireEvent.click(getByRole("button"))).resolves.toBeDefined();
    });
  });

  // ─── State transitions ────────────────────────────────────────────────────
  describe("state transitions", () => {
    it("updates visual class when state prop changes from loading to ready", async () => {
      const { container, rerender } = render(Badge, {
        props: { readingTime: 3, state: "loading" as const, onBadgeClick: vi.fn() },
      });

      let button = container.querySelector("button");
      expect(button?.className).toContain("badge--loading");

      await rerender({ readingTime: 3, state: "ready" as const, onBadgeClick: vi.fn() });

      button = container.querySelector("button");
      expect(button?.className).toContain("badge--ready");
      expect(button?.className).not.toContain("badge--loading");
    });

    it("updates text when readingTime prop changes", async () => {
      const { getByRole, rerender } = render(Badge, {
        props: { readingTime: 3, state: "ready" as const, onBadgeClick: vi.fn() },
      });

      expect(getByRole("button").textContent).toContain("3 min");

      await rerender({ readingTime: 10, state: "ready" as const, onBadgeClick: vi.fn() });

      expect(getByRole("button").textContent).toContain("10 min");
    });

    it("updates aria-label when readingTime prop changes", async () => {
      const { getByRole, rerender } = render(Badge, {
        props: { readingTime: 3, state: "ready" as const, onBadgeClick: vi.fn() },
      });

      expect(getByRole("button").getAttribute("aria-label")).toContain("3 min read");

      await rerender({ readingTime: 8, state: "ready" as const, onBadgeClick: vi.fn() });

      expect(getByRole("button").getAttribute("aria-label")).toContain("8 min read");
    });
  });
});

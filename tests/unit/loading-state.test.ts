import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import LoadingState from "../../src/sidepanel/components/LoadingState.svelte";

describe("LoadingState component", () => {
  it("renders skeleton placeholders with animate-pulse", () => {
    const { container } = render(LoadingState);
    const animatedEl = container.querySelector(".animate-pulse");
    expect(animatedEl).toBeTruthy();
  });

  it("renders multiple skeleton lines for summary area", () => {
    const { container } = render(LoadingState);
    // Summary area skeleton: at least 3 lines of placeholder text
    const skeletonLines = container.querySelectorAll(".h-4");
    expect(skeletonLines.length).toBeGreaterThanOrEqual(3);
  });

  it("renders skeleton for key points area", () => {
    const { container } = render(LoadingState);
    // Key points area: should have elements for 3 points + a heading placeholder
    // Looking for the space-y-2 container with multiple h-4 children
    const skeletonDivs = container.querySelectorAll("div[class*='h-4']");
    expect(skeletonDivs.length).toBeGreaterThanOrEqual(3);
  });
});

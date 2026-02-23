import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import SummaryView from "../../src/sidepanel/components/SummaryView.svelte";

const defaultProps = {
  summary: "This is a comprehensive guide to TypeScript development.",
  techLevel: "intermediate" as const,
  readingTime: 5,
  title: "TypeScript Complete Guide",
  language: "en" as const,
};

describe("SummaryView component", () => {
  it("renders page title", () => {
    const { getByText } = render(SummaryView, { props: defaultProps });
    expect(getByText("TypeScript Complete Guide")).toBeTruthy();
  });

  it("renders summary paragraph", () => {
    const { getByText } = render(SummaryView, { props: defaultProps });
    expect(
      getByText("This is a comprehensive guide to TypeScript development.")
    ).toBeTruthy();
  });

  it("renders tech level badge", () => {
    const { getByText } = render(SummaryView, { props: defaultProps });
    expect(getByText("intermediate")).toBeTruthy();
  });

  it("renders reading time", () => {
    const { getByText } = render(SummaryView, { props: defaultProps });
    expect(getByText("5 min read")).toBeTruthy();
  });

  it("applies green styling for beginner level", () => {
    const { getByText } = render(SummaryView, {
      props: { ...defaultProps, techLevel: "beginner" as const },
    });
    const badge = getByText("beginner");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("applies yellow styling for intermediate level", () => {
    const { getByText } = render(SummaryView, {
      props: { ...defaultProps, techLevel: "intermediate" as const },
    });
    const badge = getByText("intermediate");
    expect(badge.className).toContain("bg-yellow-100");
    expect(badge.className).toContain("text-yellow-800");
  });

  it("applies red styling for advanced level", () => {
    const { getByText } = render(SummaryView, {
      props: { ...defaultProps, techLevel: "advanced" as const },
    });
    const badge = getByText("advanced");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
  });

  it("truncates long titles with line-clamp", () => {
    const { container } = render(SummaryView, {
      props: {
        ...defaultProps,
        title:
          "This is an extremely long title that should be truncated using CSS line-clamp to avoid overflow in the side panel layout",
      },
    });
    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    expect(heading!.className).toContain("line-clamp-2");
  });
});

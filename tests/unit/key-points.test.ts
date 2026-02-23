import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import KeyPoints from "../../src/sidepanel/components/KeyPoints.svelte";

const threePoints: [string, string, string] = [
  "TypeScript adds static typing to JavaScript",
  "It compiles to plain JavaScript",
  "IDE support is excellent",
];

describe("KeyPoints component", () => {
  it("renders exactly 3 key points", () => {
    const { container } = render(KeyPoints, { props: { points: threePoints, language: "en" as const } });
    const listItems = container.querySelectorAll("ol li");
    expect(listItems.length).toBe(3);
  });

  it("renders points in order with numbers 1, 2, 3", () => {
    const { container } = render(KeyPoints, { props: { points: threePoints, language: "en" as const } });
    const numberBadges = container.querySelectorAll("ol li span:first-child");
    expect(numberBadges[0].textContent?.trim()).toBe("1");
    expect(numberBadges[1].textContent?.trim()).toBe("2");
    expect(numberBadges[2].textContent?.trim()).toBe("3");
  });

  it("renders point text content", () => {
    const { getByText } = render(KeyPoints, { props: { points: threePoints, language: "en" as const } });
    expect(getByText("TypeScript adds static typing to JavaScript")).toBeTruthy();
    expect(getByText("It compiles to plain JavaScript")).toBeTruthy();
    expect(getByText("IDE support is excellent")).toBeTruthy();
  });

  it("renders section heading 'Key Points'", () => {
    const { getByText } = render(KeyPoints, { props: { points: threePoints, language: "en" as const } });
    expect(getByText("Key Points")).toBeTruthy();
  });
});

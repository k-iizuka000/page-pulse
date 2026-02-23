import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import SetupGuide from "../../src/sidepanel/components/SetupGuide.svelte";

// Mock clipboard API
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
  });
});

describe("SetupGuide component", () => {
  describe("unavailable state", () => {
    it("renders 'Enable Chrome AI' heading", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("Enable Chrome AI")).toBeTruthy();
    });

    it("renders 7 setup steps", () => {
      const { container } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      const listItems = container.querySelectorAll("ol li");
      expect(listItems.length).toBe(7);
    });

    it("step 1 contains chrome://flags/#optimization-guide-on-device-model", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      expect(
        getByText("chrome://flags/#optimization-guide-on-device-model")
      ).toBeTruthy();
    });

    it("step 3 contains chrome://flags/#prompt-api-for-gemini-nano", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      expect(
        getByText("chrome://flags/#prompt-api-for-gemini-nano")
      ).toBeTruthy();
    });

    it("step 5 mentions restarting Chrome", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      // Step 5 text contains "Restart Chrome"
      const el = getByText((content) => content.includes("Restart Chrome"));
      expect(el).toBeTruthy();
    });

    it("step 6 contains chrome://components", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("chrome://components")).toBeTruthy();
    });

    it("renders 'Check Again' button", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("Check Again")).toBeTruthy();
    });

    it("calls onRetry when 'Check Again' is clicked", async () => {
      const onRetry = vi.fn();
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry, language: "en" },
      });
      await fireEvent.click(getByText("Check Again"));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("downloadable state", () => {
    it("renders 'AI Model Available for Download' heading", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloadable", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("AI Model Available for Download")).toBeTruthy();
    });

    it("shows download explanation text", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloadable", onRetry: vi.fn(), language: "en" },
      });
      const el = getByText((content) =>
        content.includes("download")
      );
      expect(el).toBeTruthy();
    });

    it("renders 'Try Now' button", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloadable", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("Try Now")).toBeTruthy();
    });

    it("calls onRetry when 'Try Now' is clicked", async () => {
      const onRetry = vi.fn();
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloadable", onRetry, language: "en" },
      });
      await fireEvent.click(getByText("Try Now"));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("downloading state", () => {
    it("renders 'Downloading AI Model...' heading", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloading", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("Downloading AI Model...")).toBeTruthy();
    });

    it("shows progress indicator", () => {
      const { container } = render(SetupGuide, {
        props: { availability: "downloading", onRetry: vi.fn(), language: "en" },
      });
      // The progress bar element has animate-pulse class
      const progressEl = container.querySelector(".animate-pulse");
      expect(progressEl).toBeTruthy();
    });

    it("shows downloading explanation text", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloading", onRetry: vi.fn(), language: "en" },
      });
      const el = getByText((content) =>
        content.includes("AI model is being downloaded")
      );
      expect(el).toBeTruthy();
    });

    it("renders 'Check Again' button", () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloading", onRetry: vi.fn(), language: "en" },
      });
      expect(getByText("Check Again")).toBeTruthy();
    });

    it("calls onRetry when 'Check Again' is clicked", async () => {
      const onRetry = vi.fn();
      const { getByText } = render(SetupGuide, {
        props: { availability: "downloading", onRetry, language: "en" },
      });
      await fireEvent.click(getByText("Check Again"));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("copyToClipboard", () => {
    it("copies chrome://flags URL to clipboard when clicked", async () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      const flagButton = getByText(
        "chrome://flags/#optimization-guide-on-device-model"
      );
      await fireEvent.click(flagButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "chrome://flags/#optimization-guide-on-device-model"
      );
    });

    it("copies chrome://components URL to clipboard when clicked", async () => {
      const { getByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      const componentsButton = getByText("chrome://components");
      await fireEvent.click(componentsButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "chrome://components"
      );
    });
  });

  describe("prop validation", () => {
    it("does not render 'available' state content — only handles non-available states", () => {
      // With availability="unavailable", the unavailable UI shows, not any "available" heading
      const { queryByText } = render(SetupGuide, {
        props: { availability: "unavailable", onRetry: vi.fn(), language: "en" },
      });
      // No generic "available" heading should appear when in unavailable state
      expect(queryByText("available")).toBeNull();
    });

    it("does not throw when onRetry is not provided (default no-op)", () => {
      // onRetry has a default value of () => {}, so this should not throw
      expect(() => {
        render(SetupGuide, {
          props: { availability: "unavailable", language: "en" },
        });
      }).not.toThrow();
    });
  });
});

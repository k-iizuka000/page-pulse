import { extractPageContent } from "$lib/extractor/page-content";
import { isDisabledSite } from "$lib/storage/settings";
import type { Message } from "$lib/messaging/types";
import Badge from "./Badge.svelte";
import badgeStyles from "./badge.css?inline";

/** URL schemes on which the badge must never be injected. */
const EXCLUDED_SCHEMES = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "edge://",
  "moz-extension://",
];

/**
 * Returns true if the extension context is still valid (i.e. the extension
 * has not been reloaded/uninstalled since this content script was injected).
 */
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

/** Exported for testing. Automatically invoked at module load. */
export async function init(): Promise<void> {
  // Bail out early if the extension was reloaded — this stale content script
  // can no longer use chrome.runtime APIs.
  if (!isExtensionContextValid()) return;

  const url = location.href;

  // Skip restricted URL schemes — content scripts should not run here.
  if (EXCLUDED_SCHEMES.some((scheme) => url.startsWith(scheme))) return;

  // Guard against pages where document.body is null (e.g. XML documents).
  if (!document.body) return;

  // Idempotency guard — do not inject a second badge if already present.
  if (document.getElementById("page-pulse-root")) return;

  // Bail out when the user has disabled the extension on this site.
  if (await isDisabledSite(url)) return;

  // Extract readable content and compute reading time.
  const pageContent = extractPageContent(document);

  // ── Shadow DOM host ──────────────────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "page-pulse-root";
  // Reset all inherited styles; position the badge fixed at the bottom-right.
  host.style.cssText =
    "all: initial; position: fixed; z-index: 2147483647; bottom: 20px; right: 20px;";
  document.body.appendChild(host);

  // Closed mode prevents host-page scripts from accessing the badge DOM.
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject badge styles into the shadow root so they are fully isolated from
  // the host page and do not leak outward.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(badgeStyles);
  shadow.adoptedStyleSheets = [sheet];

  // Mount point for the Svelte component.
  const mountEl = document.createElement("div");
  shadow.appendChild(mountEl);

  new Badge({
    target: mountEl,
    props: {
      readingTime: pageContent.readingTimeMinutes,
      state: "ready",
      onBadgeClick: handleBadgeClick,
    },
  });

  // ── Message listener ─────────────────────────────────────────────────────
  // Respond to GET_PAGE_CONTENT requests from the background service worker
  // or side panel with the already-extracted page content.
  try {
    chrome.runtime.onMessage.addListener(
      (
        message: Message,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
      ) => {
        if (message.type === "GET_PAGE_CONTENT") {
          sendResponse(pageContent);
        }
        // Return false (implicit) — response is synchronous.
      }
    );
  } catch {
    // Extension context invalidated — stale content script, ignore.
  }
}

/**
 * Sends a request to the background service worker to open the side panel.
 *
 * The content script CANNOT call chrome.tabs.query, so the tabId is omitted
 * here. The background SW derives it from MessageSender.tab.id.
 */
function handleBadgeClick(): void {
  try {
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  } catch {
    // Extension context invalidated — the extension was reloaded.
    // Remove the stale badge so it doesn't confuse the user.
    document.getElementById("page-pulse-root")?.remove();
  }
}

// Run automatically when the content script is injected into a page.
init().catch((err) => {
  console.warn("[Page Pulse] Content script init failed:", err);
});

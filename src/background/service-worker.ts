import { handleMessage } from "$lib/messaging/handler";

// Configure side panel to open automatically when the extension action is clicked.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Central message dispatcher. All routing logic lives in handleMessage so
// this file stays free of business logic and AI imports.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error: Error) => {
      console.error("[Page Pulse] Message handler error:", error);
      sendResponse({ error: error.message });
    });

  // Returning true keeps the message channel open until sendResponse is called
  // asynchronously. Without this Chrome closes the port immediately.
  return true;
});

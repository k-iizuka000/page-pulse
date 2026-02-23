import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Page Pulse",
  version: "0.1.0",
  description:
    "Instant page summaries powered by Chrome's built-in AI. No API key needed.",
  permissions: ["activeTab", "storage", "sidePanel"],
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
});

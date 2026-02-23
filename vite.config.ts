import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./src/manifest";
import sveltePreprocess from "svelte-preprocess";

export default defineConfig({
  plugins: [svelte({ preprocess: sveltePreprocess() }), crx({ manifest })],
  resolve: {
    alias: {
      $lib: resolve(__dirname, "src/lib"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { AIAvailability } from "$lib/ai/capabilities";
  import { destroySession } from "$lib/ai/session";
  import { runInitialize, type AppState } from "./app-logic";
  import { getSettings, updateSettings } from "$lib/storage/settings";
  import type { Language } from "$lib/storage/types";
  import type { SummaryData } from "$lib/messaging/types";
  import { t } from "$lib/i18n";
  import SummaryView from "./components/SummaryView.svelte";
  import KeyPoints from "./components/KeyPoints.svelte";
  import LoadingState from "./components/LoadingState.svelte";
  import SetupGuide from "./components/SetupGuide.svelte";

  let state: AppState = "checking";
  let summary: SummaryData | null = null;
  let pageTitle = "";
  let errorMessage = "";
  let aiAvailability: Exclude<AIAvailability, "available"> = "unavailable";
  let language: Language = "ja";

  $: msg = t(language);

  onMount(async () => {
    const settings = await getSettings();
    language = settings.language;
    await initialize();
  });

  onDestroy(() => {
    destroySession();
  });

  async function initialize() {
    state = "checking";
    errorMessage = "";

    const result = await runInitialize(language);

    state = result.state;

    if (result.summary) summary = result.summary;
    if (result.pageTitle !== undefined) pageTitle = result.pageTitle;
    if (result.errorMessage) errorMessage = result.errorMessage;
    if (result.aiAvailability) aiAvailability = result.aiAvailability;
    if (result.language) language = result.language;
  }

  function retry() {
    initialize();
  }

  async function toggleLanguage() {
    language = language === "ja" ? "en" : "ja";
    await updateSettings({ language });
    // Re-summarize with the new language (destroys cached session)
    destroySession();
    await initialize();
  }
</script>

<main class="p-4">
  <!-- Language toggle -->
  <div class="flex justify-end mb-2">
    <button
      on:click={toggleLanguage}
      class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
      aria-label="Toggle language"
    >
      {msg.langToggle}
    </button>
  </div>

  {#if state === "checking"}
    <div class="flex items-center justify-center h-32">
      <div class="text-gray-400 text-sm">{msg.checkingAI}</div>
    </div>
  {:else if state === "loading"}
    <LoadingState />
  {:else if state === "ready" && summary}
    <div class="space-y-6">
      <SummaryView
        summary={summary.summary}
        techLevel={summary.techLevel}
        readingTime={summary.readingTimeMinutes}
        title={pageTitle}
        {language}
      />
      <KeyPoints points={summary.keyPoints} {language} />
    </div>
  {:else if state === "setup"}
    <SetupGuide availability={aiAvailability} onRetry={retry} {language} />
  {:else if state === "error"}
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-red-600">
        <span class="text-xl">&#x26A0;</span>
        <h2 class="font-semibold">{msg.error.title}</h2>
      </div>
      <p class="text-sm text-gray-600">{errorMessage}</p>
      <button
        on:click={retry}
        class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        aria-label={msg.error.retry}
      >
        {msg.error.retry}
      </button>
    </div>
  {/if}
</main>

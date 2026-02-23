<script lang="ts">
  import type { AIAvailability } from "$lib/ai/capabilities";
  import type { Language } from "$lib/storage/types";
  import { t } from "$lib/i18n";

  export let availability: Exclude<AIAvailability, "available">;
  export let onRetry: () => void = () => {};
  export let language: Language = "ja";

  $: msg = t(language);

  const FLAG_URLS = {
    onDeviceModel: "chrome://flags/#optimization-guide-on-device-model",
    promptApi: "chrome://flags/#prompt-api-for-gemini-nano",
    components: "chrome://components",
  };

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API unavailable or permission denied
    });
  }
</script>

{#if availability === "unavailable"}
  <div class="space-y-4">
    <div class="text-center">
      <div class="text-4xl mb-2">&#x2699;</div>
      <h2 class="text-lg font-semibold text-gray-900">{msg.setup.enableChromeAI}</h2>
      <p class="text-sm text-gray-500 mt-1">
        {msg.setup.followSteps}
      </p>
    </div>

    <ol class="space-y-3 text-sm">
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >1</span
        >
        <div>
          <p>{msg.setup.step1}</p>
          <button
            class="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700 hover:bg-gray-200 transition-colors"
            on:click={() => copyToClipboard(FLAG_URLS.onDeviceModel)}
            title="Click to copy"
          >
            {FLAG_URLS.onDeviceModel}
          </button>
        </div>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >2</span
        >
        <p>{msg.setup.step2}</p>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >3</span
        >
        <div>
          <p>{msg.setup.step3}</p>
          <button
            class="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700 hover:bg-gray-200 transition-colors"
            on:click={() => copyToClipboard(FLAG_URLS.promptApi)}
            title="Click to copy"
          >
            {FLAG_URLS.promptApi}
          </button>
        </div>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >4</span
        >
        <p>{msg.setup.step4}</p>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >5</span
        >
        <p><strong>{msg.setup.step5}</strong></p>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >6</span
        >
        <div>
          <p>{msg.setup.step6open}</p>
          <button
            class="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700 hover:bg-gray-200 transition-colors"
            on:click={() => copyToClipboard(FLAG_URLS.components)}
            title="Click to copy"
          >
            {FLAG_URLS.components}
          </button>
          <p class="mt-1">
            {msg.setup.step6find} <strong>{msg.setup.step6model}</strong>
          </p>
        </div>
      </li>
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
          >7</span
        >
        <p>
          {msg.setup.step7prefix} <code class="text-xs bg-gray-100 px-1 rounded"
            >0.0.0.0</code
          >{msg.setup.step7action}
        </p>
      </li>
    </ol>

    <button
      on:click={onRetry}
      class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
    >
      {msg.setup.checkAgain}
    </button>
  </div>

{:else if availability === "downloadable"}
  <div class="space-y-4 text-center">
    <div class="text-4xl mb-2">&#x1F4E5;</div>
    <h2 class="text-lg font-semibold text-gray-900">{msg.setup.downloadTitle}</h2>
    <p class="text-sm text-gray-500">
      {msg.setup.downloadDesc}
    </p>

    <button
      on:click={onRetry}
      class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
    >
      {msg.setup.tryNow}
    </button>
  </div>

{:else if availability === "downloading"}
  <div class="space-y-4 text-center">
    <div class="text-4xl mb-2 animate-bounce">&#x2B07;</div>
    <h2 class="text-lg font-semibold text-gray-900">{msg.setup.downloadingTitle}</h2>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div class="bg-blue-600 h-2 rounded-full animate-pulse w-2/3"></div>
    </div>
    <p class="text-sm text-gray-500">
      {msg.setup.downloadingDesc}
    </p>

    <button
      on:click={onRetry}
      class="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
    >
      {msg.setup.checkAgain}
    </button>
  </div>
{/if}

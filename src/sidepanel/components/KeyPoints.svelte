<script lang="ts">
  import type { Language } from "$lib/storage/types";
  import { t } from "$lib/i18n";

  export let points: [string, string, string];
  export let language: Language = "ja";

  $: msg = t(language);
</script>

<div class="space-y-2">
  <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
    {msg.keyPoints}
  </h3>
  <ol class="space-y-2">
    {#each points as point, i}
      <li class="flex gap-3">
        <span
          class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
        >
          {i + 1}
        </span>
        <span class="text-gray-700 text-sm leading-relaxed">{point}</span>
      </li>
    {/each}
  </ol>
</div>

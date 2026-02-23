<script lang="ts">
  import type { Language } from "$lib/storage/types";
  import { t } from "$lib/i18n";

  export let summary: string;
  export let techLevel: "beginner" | "intermediate" | "advanced";
  export let readingTime: number;
  export let title: string;
  export let language: Language = "ja";

  $: msg = t(language);

  const levelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };
</script>

<div class="space-y-4">
  <h2 class="text-lg font-semibold text-gray-900 line-clamp-2">{title}</h2>

  <div class="flex items-center gap-2 text-sm">
    <span
      class="px-2 py-0.5 rounded-full text-xs font-medium {levelColors[techLevel]}"
    >
      {msg.techLevel[techLevel]}
    </span>
    <span class="text-gray-500">{msg.minRead(readingTime)}</span>
  </div>

  <p class="text-gray-700 leading-relaxed">{summary}</p>
</div>

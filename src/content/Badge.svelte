<script lang="ts">
  export let readingTime: number;
  export let state: "loading" | "ready" | "setup-needed" | "error" = "ready";
  export let onBadgeClick: () => void = () => {};
</script>

<button
  class="badge badge--{state}"
  on:click={onBadgeClick}
  aria-label="Page Pulse: {readingTime} min read"
>
  {#if state === "loading"}
    <span class="badge__pulse">{readingTime} min</span>
  {:else if state === "ready"}
    <span class="badge__icon">P</span>
    <span class="badge__text">{readingTime} min</span>
  {:else if state === "setup-needed"}
    <span class="badge__icon badge__icon--warn">!</span>
    <span class="badge__text">Setup</span>
  {:else if state === "error"}
    <span class="badge__icon badge__icon--error">x</span>
    <span class="badge__text">Error</span>
  {/if}
</button>

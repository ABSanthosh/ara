<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let dialogElement = $state<HTMLDialogElement | undefined>();
  let searchQuery = $state("");
  let inputElement = $state<HTMLInputElement | undefined>();

  // Watch for visibility changes to focus input
  $effect(() => {
    if (dialogElement?.open && inputElement) {
      setTimeout(() => {
        inputElement?.focus();
      }, 100);
    } else if (!dialogElement?.open) {
      searchQuery = "";
    }
  });

  // Handle keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    // Close on Escape
    if (e.key === "Escape" && dialogElement?.open) {
      e.preventDefault();
      dialogElement.close();
    }
  }

  // Listen for toggle event from content script
  function handleToggle() {
    if (dialogElement) {
      if (dialogElement.open) {
        dialogElement.close();
      } else {
        dialogElement.showModal();
      }
    }
  }

  onMount(() => {
    window.addEventListener("toggle-spotlight", handleToggle);
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("toggle-spotlight", handleToggle);
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

<dialog
  bind:this={dialogElement}
  class="spotlight-dialog-container"
  onclick={(e) => {
    // if click is not inside spotlight div, close dialog
    const spotlightDiv = dialogElement?.querySelector(".spotlight");
    if (spotlightDiv && !spotlightDiv.contains(e.target as Node)) {
      dialogElement?.close();
    }
  }}
  onclose={() => {
    searchQuery = "";
  }}
>
  <div class="spotlight">
    <!-- TODO: Change this to lucid icons -->
    <svg
      class="search-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <input
      bind:this={inputElement}
      bind:value={searchQuery}
      type="text"
      placeholder="Spotlight Search"
      class="spotlight-input"
    />
  </div>
</dialog>

<style lang="scss">
  @use "../../styles/mixins" as *;

  .spotlight-dialog-container {
    padding: 0;
    border: none;
    @include box();
    max-width: unset;
    max-height: unset;
    background: transparent;

    &:not([open]) {
      display: none;
    }

    &[open] {
      @include make-flex($just: flex-start);
    }
  }

  .spotlight {
    gap: 10px;
    width: 100%;
    max-height: 40px;
    margin-top: 100px;
    padding: 5px 10px;
    max-width: 460px;
    border-radius: 30px;
    background: #0000007d;
    @include make-flex(center, center);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 0 20px 1px rgba(0, 0, 0, 0.529);
    backdrop-filter: blur(5px) saturate(170%) brightness(1.04);

    & > .search-icon {
      flex-shrink: 0;
      fill: rgba(255, 255, 255, 0.9);
      width: 25px;
      height: 25px;
    }
  }

  .spotlight-input {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 18px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 0.2px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 400;
    }

    &:focus::placeholder {
      opacity: 0.6;
    }
  }
</style>

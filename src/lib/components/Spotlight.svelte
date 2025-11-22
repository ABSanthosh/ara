<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let visible = $state(false);
  let searchQuery = $state("");
  let inputElement = $state<HTMLInputElement | undefined>();

  // Watch for visibility changes to focus input
  $effect(() => {
    if (visible && inputElement) {
      setTimeout(() => {
        inputElement?.focus();
      }, 100);
    } else if (!visible) {
      searchQuery = "";
    }
  });

  // Close when clicking outside
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      visible = false;
    }
  }

  // Handle escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && visible) {
      e.preventDefault();
      visible = false;
    }
  }

  // Listen for toggle event from content script
  function handleToggle() {
    visible = !visible;
  }

  onMount(() => {
    window.addEventListener('toggle-spotlight', handleToggle);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('toggle-spotlight', handleToggle);
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if visible}
  <div class="spotlight-backdrop" onclick={handleBackdropClick} role="presentation">
    <div class="spotlight-container">
      <div class="spotlight-search">
        <svg
          class="spotlight-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18.5 18.5l-5-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <input
          bind:this={inputElement}
          type="text"
          bind:value={searchQuery}
          placeholder="Search..."
          class="spotlight-input"
        />
      </div>

      <div class="spotlight-results">
        {#if searchQuery.trim() === ""}
          <div class="spotlight-empty">Start typing to search...</div>
        {:else}
          <div class="spotlight-empty">No results for "{searchQuery}"</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .spotlight-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    z-index: 999999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .spotlight-container {
    width: 600px;
    max-width: 90vw;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideDown 0.2s ease-out;
  }

  @media (prefers-color-scheme: dark) {
    .spotlight-container {
      background: #1e1e1e;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .spotlight-search {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e5e5;
    gap: 12px;
  }

  @media (prefers-color-scheme: dark) {
    .spotlight-search {
      border-bottom-color: #333;
    }
  }

  .spotlight-icon {
    color: #666;
    flex-shrink: 0;
  }

  @media (prefers-color-scheme: dark) {
    .spotlight-icon {
      color: #999;
    }
  }

  .spotlight-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 18px;
    background: transparent;
    color: #000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;

    &::placeholder {
      color: #999;
    }
  }

  @media (prefers-color-scheme: dark) {
    .spotlight-input {
      color: #fff;

      &::placeholder {
        color: #666;
      }
    }
  }

  .spotlight-results {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
  }

  .spotlight-empty {
    padding: 40px 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  @media (prefers-color-scheme: dark) {
    .spotlight-empty {
      color: #666;
    }
  }
</style>

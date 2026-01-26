<script lang="ts">
  import { type Snippet } from "svelte";
  import clickOutside from "../utils/onClickOutside";

  let {
    children,
    heading,
    showContainer = $bindable(),
    onclose,
  }: {
    heading: string;
    children: Snippet;
    showContainer: boolean;
    onclose?: () => void;
  } = $props();

  let containerWrapper: HTMLDivElement | undefined = $state();
  let container: HTMLDivElement | undefined = $state();
</script>

{#if showContainer}
  <div
    class="ContainerWrapper"
    bind:this={containerWrapper}
    use:clickOutside
    onOutClick={() => {
      showContainer = false;
      onclose?.();
    }}
  >
    <div class="Container" bind:this={container}>
      <h2 class="Container__header">
        {heading}
        <button
          onclick={() => {
            showContainer = false;
            onclose?.();
          }}
        >
          ✕
        </button>
      </h2>
      <div class="Container__content">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .ContainerWrapper {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    animation: backdropFadeIn 0.35s ease forwards;
  }

  .Container {
    width: 90%;
    color: #fff;
    max-width: 600px;

    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.49);
    box-shadow: 0 0 20px 1px #00000087;
    backdrop-filter: blur(26px) saturate(170%) brightness(1.04);

    animation: morphIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 1.5rem;
      font-weight: bold;
      opacity: 0;
      animation: fadeIn 0.2s 0.2s ease forwards;

      & > button {
        color: white;
        padding: 3px;
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 25px;
        height: 25px;
        transition: all 0.3s ease;
        background-color: transparent;

        &:hover {
          background-color: #ec6e6e;
        }
      }
    }

    &__content {
      padding: 10px 20px 20px 20px;
      max-height: 70vh;
      overflow-y: auto;
      opacity: 0;
      animation: fadeIn 0.3s 0.25s ease forwards;
    }
  }

  @keyframes backdropFadeIn {
    from {
      background: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
    }
    to {
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
    }
  }

  @keyframes morphIn {
    from {
      opacity: 0.5;
      border-radius: 50%;
      transform: scale(0.05);
    }
    to {
      opacity: 1;
      border-radius: 20px;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

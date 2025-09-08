<script lang="ts">
  import { type Snippet } from "svelte";
  import clickOutside from "../utils/onClickOutside";

  let {
    children,
    heading,
    showModal = $bindable(),
  }: {
    heading: string;
    children: Snippet;
    showModal: boolean;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (dialog && showModal) dialog.showModal();
  });
</script>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog
    use:clickOutside
    bind:this={dialog}
    class="ModalWrapper"
    onclose={() => (showModal = false)}
    onOutClick={() => (showModal = false)}
  >
    <div class="Modal">
      <h2 class="Modal__header">
        {heading}
        <button
          onclick={() => {
            showModal = false;
            if (dialog) dialog.close();
          }}
        >
          ✕
        </button>
      </h2>
      <div class="Modal__content">
        {@render children?.()}
      </div>
    </div>
  </dialog>
{/if}

<style lang="scss">
  @use "../../styles/mixins.scss" as *;

  .ModalWrapper {
    padding: 0;
    border: none;
    color: inherit;
    position: fixed;
    @include make-flex();
    background: transparent;
    @include box(100vw, 100vh);

    &::backdrop {
      backdrop-filter: blur(5px);
    }
  }

  .Modal {
    width: 90%;
    color: #fff;
    max-width: 600px;
    animation: fadeInScale 0.3s ease forwards;

    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.49);
    box-shadow: 0 0 20px 1px #00000087;
    backdrop-filter: blur(26px) saturate(170%) brightness(1.04);

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 1.5rem;
      font-weight: bold;

      & > button {
        color: white;
        padding: 3px;
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 6px;
        @include make-flex();
        @include box(25px, 25px);
        transition: all 0.3s ease;
        background-color: transparent;
        &:hover {
          background-color: #ec6e6e;

          &::before {
            color: #fff;
          }
        }
      }
    }

    &__content {
      padding: 10px 20px 20px 20px;
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

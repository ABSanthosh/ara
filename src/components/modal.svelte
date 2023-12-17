<script lang="ts">
  export let showModal: boolean = false;
  let dialog: HTMLDialogElement;
  $: if (dialog && showModal) dialog.showModal();
  $: if (dialog && !showModal) dialog.close();

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
  class="Modal"
  bind:this={dialog}
  on:close={() => (showModal = false)}
  on:click|self={() => dialog.close()}
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="Modal__content" on:click|stopPropagation>
    <slot />
  </div>
</dialog>

<style lang="scss">
  .Modal {
    position: fixed;
    @include box(100vw, 100vh);
    @include make-flex();
    // max-width: 32em;
    background: transparent;
    border: none;
    padding: 0;

    &::backdrop {
      background: rgba(0, 0, 0, 0.3);
    }

    &:-internal-dialog-in-top-layer {
      max-width: unset;
      max-height: unset;
    }

    &__content {
      display: none;
      border-radius: 15px;
      background-color: transparent;
      @include box(min(80vw, 80vh), 530px);
    }

    &[open] {
      animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    &[open] > &__content {
      display: flex;
    }
  }

  @keyframes zoom {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }
  dialog[open]::backdrop {
    animation: fade 0.2s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

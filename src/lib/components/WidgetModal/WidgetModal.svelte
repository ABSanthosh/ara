<script lang="ts">
  import { LayoutPanelLeft, Settings, Wallpaper, X } from "@lucide/svelte";
  import AppearancePane from "./AppearancePane.svelte";

  let {
    showModal = $bindable(),
  }: {
    showModal: boolean;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (dialog && showModal) dialog.showModal();
  });

  type ItemKey = "General" | "Appearance" | "Widgets";

  const items: Record<
    ItemKey,
    {
      name: string;
      icon: typeof Settings | typeof Wallpaper | typeof LayoutPanelLeft;
    }
  > = {
    General: { name: "General", icon: Settings },
    Appearance: { name: "Appearance", icon: Wallpaper },
    Widgets: { name: "Widgets", icon: LayoutPanelLeft },
  };
  let selectedKey: ItemKey = $state("Appearance");
</script>

{#snippet GeneralPane()}
  <h2 class="Modal__pane--header">General</h2>
{/snippet}

{#snippet WidgetsPane()}
  <h2 class="Modal__pane--header">Widgets</h2>
{/snippet}

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog
    class="ModalWrapper"
    bind:this={dialog}
    onclose={() => (showModal = false)}
  >
    <div class="Modal">
      <h2 class="Modal__header">
        Settings
        <button
          onclick={() => {
            showModal = false;
            if (dialog) dialog.close();
          }}
        >
          <X />
        </button>
      </h2>
      <div class="Modal__content">
        <ul class="Modal__sidebar">
          {#each Object.keys(items) as key (key)}
            {@const k = key as ItemKey}
            {@const item = items[k]}
            <li class="Modal__sidebar-item">
              <label class="Modal__sidebar-option">
                <input
                  class="Modal__radio"
                  type="radio"
                  name="settings-sections"
                  bind:group={selectedKey}
                  value={k}
                  aria-label={item.name}
                />
                <item.icon />
                <span>{item.name}</span>
              </label>
            </li>
          {/each}
        </ul>
        <div class="Modal__pane">
          {#if selectedKey === "Appearance"}
            <AppearancePane />
          {:else if selectedKey === "General"}
            {@render GeneralPane()}
          {:else}
            {@render WidgetsPane()}
          {/if}
        </div>
      </div>
    </div>
  </dialog>
{/if}

<style lang="scss">
  @use "../../../styles/mixins.scss" as *;

  .ModalWrapper {
    inset: 0;
    border: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    position: fixed;
    align-items: end;
    justify-items: center;
    overflow: hidden;
    background: transparent;

    // Remove UA size constraints in top layer (Chrome/Safari)
    &:-internal-dialog-in-top-layer {
      max-width: none;
      max-height: none;
    }

    &[open] > .Modal {
      animation: modal-zoom 0.25s ease-out;
    }
    &[open] > .Modal {
      display: flex;
    }

    &[open]::backdrop {
      animation: modal-fade 0.18s ease-out;
    }
  }

  .Modal {
    height: 620px;
    width: min(960px, 80vw);

    display: flex;
    flex-direction: column;
    border-radius: 18px 18px 0 0;

    backdrop-filter: blur(26px) saturate(170%) brightness(1.04);
    -webkit-backdrop-filter: blur(26px) saturate(170%) brightness(1.04);
    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.18) 0%,
        rgba(255, 255, 255, 0.1) 40%,
        rgba(255, 255, 255, 0.08) 100%
      ),
      rgba(30, 30, 32, 0.52); // neutral dark tint

    border-left: 1px solid rgba(255, 255, 255, 0.22);
    border-right: 1px solid rgba(255, 255, 255, 0.22);

    box-shadow:
      0 32px 60px rgba(0, 0, 0, 0.35),
      0 12px 26px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);

    color: #f5f5f7;
    overflow: hidden; // clip inner sections to rounded corner
    -webkit-font-smoothing: antialiased;

    &__header {
      font-size: 25px;
      color: #f4f4f4;
      font-weight: 500;
      padding: 12px 14px 10px 16px;
      @include box(100%, auto);
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.22);
      @include make-flex($dir: row, $just: space-between);

      & > button {
        padding: 3px;
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 6px;
        @include make-flex();
        @include box(25px, 25px);
        transition: all 0.3s ease;
        background-color: #acacac;
        &:hover {
          background-color: #ec6e6e;

          &::before {
            color: #fff;
          }
        }

        &::before {
          font-size: 18px;
          color: #727272;
        }
      }
    }

    &__content {
      min-width: 0;
      min-height: 0;
      display: grid;
      @include box();
      grid-template-columns: 240px 1fr;
    }

    &__sidebar {
      gap: 5px;
      padding: 12px;
      flex-wrap: wrap;
      overflow-y: auto;
      list-style: none;
      @include make-flex($just: flex-start);
      border-right: 1.5px solid rgba(255, 255, 255, 0.22);

      & > li {
        @include box(100%, 45px);

        & > label {
          gap: 10px;
          border: none;
          outline: none;
          @include box();
          padding: 0 15px;
          cursor: pointer;
          color: #f5f5f7;
          font-size: large;
          position: relative;
          border-radius: 12px;
          background-color: transparent;
          transition: all 0.1s ease-in-out;
          @include make-flex($dir: row, $just: flex-start);

          & > input {
            inset: 0;
            opacity: 0;
            position: absolute;
            pointer-events: none;
          }

          &:has(.Modal__radio:checked) {
            background: rgba(255, 255, 255, 0.2);
            // background-color: #338cec;
            color: #fff;

            svg {
              color: #fff;
            }
          }
        }
      }
    }

    &__pane {
      padding: 16px;
      overflow: auto;
    }
  } 

  // Keyframes
  @keyframes modal-zoom {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes modal-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

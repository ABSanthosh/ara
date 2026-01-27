<script lang="ts">
  import { LayoutDashboard, Settings, Wallpaper, X } from "@lucide/svelte";
  import AppearancePane from "./AppearancePane.svelte";
  import WidgetsPane from "./WidgetsPane.svelte";
  import GeneralPane from "./GeneralPane.svelte";

  let {
    showModal = $bindable(),
  }: {
    showModal: boolean;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  type ItemKey = "General" | "Appearance" | "Widgets";

  $effect(() => {
    if (dialog && showModal) dialog.showModal();
  });

  const items: Record<
    ItemKey,
    {
      name: string;
      icon: typeof Settings | typeof Wallpaper | typeof LayoutDashboard;
    }
  > = {
    General: { name: "General", icon: Settings },
    Appearance: { name: "Appearance", icon: Wallpaper },
    Widgets: { name: "Widgets", icon: LayoutDashboard },
  };
  let selectedKey: ItemKey = $state("Widgets");
</script>

{#if showModal}
  <dialog
    class="SettingsWrapper"
    bind:this={dialog}
    onclick={(e: MouseEvent) => {
      if (e.target === dialog) {
        showModal = false;
      }
    }}
    onclose={() => (showModal = false)}
  >
    <div class="Settings">
      <!-- sidebar -->
      <aside class="Settings__sidebar blur-recessed">
        <h2>Settings</h2>
        <ul>
          {#each Object.entries(items) as [key, item] ([key, item])}
            <li
              class:selected={selectedKey === key}
              onclick={() => (selectedKey = key as ItemKey)}
            >
              <label>
                <input
                  type="radio"
                  name="settings-item"
                  bind:group={selectedKey}
                  value={key}
                  hidden
                />
                <item.icon size="18" />
                <span>{item.name}</span>
              </label>
            </li>
          {/each}
        </ul>
      </aside>
      <!-- content -->
      <main class="Settings__content blur-thin">
        <button
          class="CrispButton blur-recessed"
          aria-label="close"
          data-type="inverse-danger"
          onclick={() => (showModal = false)}
        >
          <X size="18" stroke-width="3" />
        </button>
        {#if selectedKey === "General"}
          <GeneralPane />
        {:else if selectedKey === "Appearance"}
          <AppearancePane />
        {:else if selectedKey === "Widgets"}
          <WidgetsPane />
        {/if}
      </main>
    </div>
  </dialog>
{/if}

<style lang="scss">
  .Settings {
    --__border-radius: 40px;
    height: 650px;
    width: min(1000px, 80vw);

    display: grid;
    grid-template-columns: 260px 1fr;

    &__sidebar {
      padding: 18px;
      border-top: 1px solid var(--separator);
      border-left: 1px solid var(--separator);
      border-right: 1px solid var(--separator);
      border-radius: var(--__border-radius) 0 0 0;
      @include make-flex($just: flex-start, $gap: 12px);

      & > h2 {
        font-size: 34px;
        font-weight: 700;
        padding: 10px 12px 0 12px;
        @include box(100%, auto);
        @include make-flex($dir: row, $just: space-between);
      }

      & > ul {
        width: 100%;
        list-style: none;
        margin-top: 10px;
        @include make-flex($dir: column, $just: flex-start, $gap: 8px);

        & > li {
          @include box(100%, 45px);

          & > label {
            border: none;
            outline: none;
            @include box();
            padding: 0 15px;
            cursor: pointer;
            font-size: large;
            position: relative;
            border-radius: 12px;
            color: var(--text-secondary);
            background-color: transparent;
            transition: all 0.1s ease-in-out;
            @include make-flex($dir: row, $just: flex-start, $gap: 10px);

            @supports (corner-shape: squircle) {
              border-radius: 40px;
              corner-shape: squircle;
            }

            & > input {
              inset: 0;
              opacity: 0;
              position: absolute;
              pointer-events: none;
            }

            &:has(input:checked) {
              color: #fff;
              background: var(--labels-secondary);

              svg {
                color: #fff;
              }
            }
          }
        }
      }
    }

    &__content {
      height: 100%;
      display: flex;
      overflow: hidden;
      border-radius: 0 var(--__border-radius) 0 0;
      border-top: 1px solid var(--separator);
      border-right: 1px solid var(--separator);

      & > .CrispButton[data-type="inverse-danger"] {
        position: absolute;
        z-index: 10;
        top: 23px;
        right: 25px;
        @include box(30px, 30px);
        --crp-button-radius: 10px;
        --crp-button-corner-shape: round;
        --crp-button-padding-x: 4px;
        --crp-button-padding-y: 4px;
      }
    }
  }

  .SettingsWrapper {
    inset: 0;
    border: 0;
    padding: 0;
    width: 100vw;
    z-index: 1000;
    height: 100vh;
    display: grid;
    position: fixed;
    max-width: none;
    max-height: none;
    align-items: end;
    overflow: hidden;
    justify-items: center;
    background: transparent;

    // Remove UA size constraints in top layer (Chrome/Safari)
    &:-internal-dialog-in-top-layer {
      max-width: none;
      max-height: none;
    }

    &[open] > .Settings {
      animation: modal-zoom 0.25s ease-out;

      &__sidebar,
      &__content {
        animation: modal-fade 0.18s ease-out;
      }
    }

    &[open]::backdrop {
      animation: modal-fade 0.18s ease-out;
    }
  }

  @keyframes modal-zoom {
    from {
      // opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      // opacity: 1;
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

<script lang="ts">
  let {
    menuItems,
  }: {
    menuItems: (
      | {
          name: string;
          onClick: () => void;
          displayText: string;
        }
      | {
          name: "hr";
        }
      | {
          name: "label";
          displayText: string;
        }
    )[];
  } = $props();

  let pos = $state({ x: 600, y: 300 });
  let menu = { h: 0, w: 0 };
  let browser = { h: 0, w: 0 };
  let showMenu = $state(false);

  function getContextMenuDimension(node: HTMLElement) {
    let height = node.offsetHeight;
    let width = node.offsetWidth;
    menu = {
      h: height,
      w: width,
    };
  }
</script>

<svelte:window
  oncontextmenu={(event: MouseEvent) => {
    // Check if the right-click is inside an element with data-isolate-context
    const target = event.target as HTMLElement;
    const isolatedElement = target.closest("[data-isolate-context]");

    if (isolatedElement) {
      // Let the isolated element handle its own context menu
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    showMenu = true;
    browser = {
      w: window.innerWidth,
      h: window.innerHeight,
    };
    pos = {
      x: event.clientX,
      y: event.clientY,
    };

    if (browser.h - pos.y < menu.h) pos.y = pos.y - menu.h;
    if (browser.w - pos.x < menu.w) pos.x = pos.x - menu.w;
  }}
  onclick={(e: MouseEvent) => {
    // if the click is outside the context menu, hide it
    if (showMenu && !(e.target as HTMLElement).closest(".context-menu")) {
      showMenu = false;
    }
  }}
/>

{#if showMenu}
  <nav
    use:getContextMenuDimension
    class="context-menu blur-regular"
    style="position:absolute; top:{pos.y}px; left:{pos.x}px"
  >
    <ul class="context-menu__list">
      {#each menuItems as item}
        {#if item.name === "hr"}
          <hr class="context-menu__separator" />
        {:else if item.name === "label"}
          <li class="context-menu__item context-menu__item--disabled">
            <span class="context-menu__button">{item.displayText}</span>
          </li>
        {:else}
          <li class="context-menu__item">
            <button
              class="context-menu__button"
              onclick={() => {
                if ("onClick" in item) {
                  item.onClick();
                  showMenu = false;
                }
              }}
              type="button"
            >
              {"displayText" in item ? item.displayText : ""}
            </button>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>
{/if}

<style lang="scss">
  .context-menu {
    min-width: 210px;
    padding: 8px;
    border-radius: 10px;

    @supports (corner-shape: squircle) {
      border-radius: 30px;
      corner-shape: squircle;
    }

    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.1),
        rgba(255, 255, 255, 0.06)
      ),
      rgba(24, 24, 24, 0.55);

    border: 1px solid var(--separator-secondary);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);

    color: #fff;
    -webkit-font-smoothing: antialiased;
    z-index: 1000;

    &__list {
      padding: 0;
      list-style: none;
    }

    &__item {
      border-radius: 6px;

      @supports (corner-shape: squircle) {
        border-radius: 20px;
        corner-shape: squircle;
      }

      overflow: hidden;

      &--disabled {
        opacity: 0.55;
        pointer-events: none;

        .context-menu__button {
          color: rgba(255, 255, 255, 0.55);
        }
      }
    }

    &__button {
      border: 0;
      width: 100%;
      line-height: 1;
      cursor: pointer;
      font-size: 16px;
      min-height: 28px;
      text-align: left;
      padding: 5px 12px;
      border-radius: 6px;
      background: transparent;

      &:active,
      &:hover {
        // background: rgba(255, 255, 255, 0.18);
        color: #fff;
        background: var(--labels-secondary);
      }

      &:focus-visible {
        outline-offset: 2px;
        outline: 2px solid rgba(74, 144, 226, 0.95);
      }
    }

    &__separator {
      border: 0;
      // height: 0.1px;
      width: 90%;
      margin: 6px auto;
      border: 0.2px solid rgba(255, 255, 255, 0.13);
    }

    &__button-content {
      gap: 8px;
      display: flex;
      align-items: center;

      &-icon {
        width: 16px;
        height: 16px;
        opacity: 0.9;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
      }

      &-label {
        flex: 1;
      }

      &-shortcut {
        font-feature-settings: "tnum";
        color: rgba(255, 255, 255, 0.7);
      }
    }

    &--light {
      background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.65),
          rgba(255, 255, 255, 0.55)
        ),
        rgba(245, 245, 247, 0.65);
      color: #111;
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);

      .context-menu__button {
        color: #111;

        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }
      }

      .context-menu__separator {
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.06),
          rgba(0, 0, 0, 0.18),
          rgba(0, 0, 0, 0.06)
        );
      }
    }
  }
</style>

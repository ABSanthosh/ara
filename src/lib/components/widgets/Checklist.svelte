<script lang="ts">
  import { onMount } from "svelte";
  import type { ChecklistWidget } from "@/lib/modules/widgets/widgets.types";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import { nanoid } from "nanoid";
  import { X } from "@lucide/svelte";

  let {
    widget,
  }: {
    widget: ChecklistWidget & { isDemo?: boolean };
  } = $props();

  let editValue = $state("");
  let showInput = $state(false);
  let inputValue = $state("");
  let items = $derived(widget.settings.items);
  let inputElement = $state<HTMLInputElement>();
  let editingItemId = $state<string | null>(null);
  let editInputElement = $state<HTMLInputElement>();
  function hideInput() {
    showInput = false;
    inputValue = "";
  }

  function cancelEdit() {
    editValue = "";
    editingItemId = null;
  }

  function updateItems(
    items: { id: string; text: string; completed: boolean }[],
  ) {
    WidgetEngine.updateWidget(widget.id!, {
      settings: { items },
    });
  }

  function saveEdit() {
    if (editValue.trim() && editingItemId) {
      const item = items.find((it) => it.id === editingItemId);
      if (item) {
        item.text = editValue.trim();
        updateItems(
          widget.settings.items.map((it) =>
            it.id === editingItemId ? { ...it, text: editValue.trim() } : it,
          ),
        );
      }
    }
    cancelEdit();
  }

  onMount(() => {
    // svelte-ignore state_referenced_locally
    const unsubscribe = WidgetEngine.subscribeTo(
      widget.id!,
      (updatedWidget) => {
        widget = updatedWidget as ChecklistWidget;
      },
    );

    return () => {
      unsubscribe();
    };
  });
</script>

<div
  role="region"
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  data-isolate-context="true"
  class="checklist-box blur-thin"
  oncontextmenu={(event: MouseEvent) => {
    event.preventDefault();
    showInput = true; // Focus the input after it's rendered
    setTimeout(() => inputElement?.focus(), 0);
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
  "
>
  <div class="checklist">
    {#if showInput}
      <div class="checklist-input">
        <input
          type="text"
          onblur={hideInput}
          bind:value={inputValue}
          bind:this={inputElement}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (inputValue.trim()) {
                const newItem = {
                  id: nanoid(),
                  text: inputValue.trim(),
                  completed: false,
                };
                updateItems([...widget.settings.items, newItem]);
                hideInput();
              }
            } else if (e.key === "Escape") hideInput();
          }}
          placeholder="Enter new task..."
        />
      </div>
    {/if}
    <ul class="checklist-items">
      {#each items as item (item.id)}
        <li class:completed={item.completed}>
          <label for="item-{item.id}" class="sr-only">
            <input
              type="checkbox"
              id="item-{item.id}"
              checked={item.completed}
              onchange={() => {
                updateItems(
                  widget.settings.items.map((it) =>
                    it.id === item.id
                      ? { ...it, completed: !it.completed }
                      : it,
                  ),
                );
                // Add strikethrough, then remove after animation
                setTimeout(() => {
                  updateItems(
                    widget.settings.items.filter((it) => it.id !== item.id),
                  );
                }, 500);
              }}
            />
          </label>

          {#if editingItemId === item.id}
            <!-- Edit mode -->
            <input
              type="text"
              class="edit-input"
              onblur={saveEdit}
              bind:value={editValue}
              bind:this={editInputElement}
              onkeydown={(event: KeyboardEvent) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveEdit();
                } else if (event.key === "Escape") {
                  cancelEdit();
                }
              }}
            />
          {:else}
            <!-- Normal mode -->
            <p
              tabindex="0"
              role="button"
              class="item-text"
              title={item.text}
              aria-label={`Edit ${item.text}`}
              ondblclick={() => {
                editingItemId = item.id;
                editValue = item.text;
                setTimeout(() => {
                  editInputElement?.focus();
                  editInputElement?.select();
                }, 0);
              }}
            >
              {item.text}
            </p>

            <button
              class="delete-button"
              onclick={() => {
                updateItems(
                  widget.settings.items.filter((it) => it.id !== item.id),
                );
              }}
              title="Delete item"
            >
              <X size="14" />
            </button>
          {/if}
        </li>
      {/each}
    </ul>

    {#if items.length === 0 && !showInput}
      <div class="empty-state" data-isolate-context="true">
        <p>No tasks yet</p>
        <p class="empty-hint">Right-click to add a new task</p>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .checklist-box {
    --__background: rgba(255, 255, 255, 0.95);

    @include box();
    position: relative;
    border-radius: 20px;
    background: var(--__background);
    color: var(--vibrant-labels-tertiary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(168, 168, 168, 0.394);

    & > * {
      user-select: none;
    }

    .checklist {
      height: 100%;
      padding: 10px;
      overflow: hidden;
      max-height: 100%;
      @include make-flex($just: flex-start, $gap: 6px);
      &:hover {
        .checklist-items {
          &::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
          }
        }
      }

      .checklist-input {
        flex-shrink: 0;
        & > input {
          width: 100%;
          outline: none;
          font-size: 14px;
          padding: 6px 8px;

          border-radius: 8px;
          @supports (corner-shape: squircle) {
            border-radius: 20px;
            corner-shape: squircle;
          }

          background: linear-gradient(
            135deg,
            var(--colors-background) 0%,
            var(--colors-background-secondary) 100%
          );
          border: 2px solid var(--separator);
          transition: border-color 0.2s ease;

          &:focus {
            border-color: var(--colors-blue);
          }

          &::placeholder {
            color: var(--vibrant-labels-secondary);
          }
        }
      }

      .checklist-items {
        flex: 1;
        width: 100%;
        min-height: 0;
        list-style: none;
        overflow-y: auto;
        padding-right: 4px;
        margin-right: -7px;
        width: calc(100% + 8px);
        scrollbar-gutter: stable;
        @include make-flex($align: flex-start, $just: flex-start, $gap: 6px);

        /* Custom scrollbar */
        &::-webkit-scrollbar {
          width: 4px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 2px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        // animation: vertical-scroll-shadow linear;
        // animation-timeline: scroll(self block);

        & > li {
          min-height: 32px;
          @include box(100%, auto);
          font-size: 14px;
          padding: 0px 0px 0px 5px;
          position: relative;
          // border-radius: 8px;
          transition: all 0.3s ease;
          // background: var(--__background);

          padding: 3px 6px;
          border-radius: 8px;
          @supports (corner-shape: squircle) {
            border-radius: 15px;
            corner-shape: squircle;
          }
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.1);

          // &:has(label input[type="checkbox"]:checked) {
          //   animation: fadeout 0.5s ease;
          //   animation-delay: 0.2s;
          // }

          @include make-flex(
            $dir: row,
            $align: center,
            $just: flex-start,
            $gap: 4px
          );

          &:hover {
            .delete-button {
              opacity: 1;
              visibility: visible;
            }
          }

          .delete-button {
            right: 5px;
            opacity: 0;
            border: none;
            flex-shrink: 0;
            position: absolute;
            margin-bottom: 1px;
            visibility: hidden;

            border-radius: 4px;
            @supports (corner-shape: squircle) {
              border-radius: 15px;
              corner-shape: squircle;
            }

            color: white;
            cursor: pointer;
            @include make-flex();
            @include box(20px, 20px);
            transition: all 0.2s ease;
            background: var(--colors-pink);

            &:hover {
              transform: scale(1.1);
              background: var(--colors-red);
            }

            &:active {
              transform: scale(0.95);
            }
          }

          // Text box
          & > p {
            flex: 1;
            outline: none;
            cursor: text;
            padding: 0 4px;
            @include text-ellipsis;
            @include box($height: 25px);
            border: 1px solid transparent;
            @include make-flex($align: flex-start);

            &:focus {
              border: 1px solid var(--colors-blue);
              border-radius: 6px;
            }
          }

          // Checkbox
          & > label {
            flex-shrink: 0;
            cursor: pointer;
            border-radius: 50%;
            position: relative;
            @include box(17px, 17px);
            @include make-flex($align: center, $just: center);
            background: var(--colors-background-secondary);
            border: 1px solid #abababdc;
            & > input[type="checkbox"] {
              opacity: 0;
              visibility: hidden;
              position: absolute;
              @include box(0, 0);
            }

            &::after {
              content: "";
              border-radius: 50%;
              @include box(11px, 11px);
              transition: all 0.2s ease;
              background: var(--colors-background);
            }

            &:has(input[type="checkbox"]:checked) {
              border-color: var(--colors-green);
              &::after {
                background: var(--colors-green);
              }
            }
          }

          // Edit input
          & > .edit-input {
            z-index: 1;
            // same as checklist-input input
            width: 100%;
            outline: none;
            font-size: 13px;
            padding: 3px 6px;
            margin-right: -4px;

            border-radius: 8px;
            @supports (corner-shape: squircle) {
              border-radius: 20px;
              corner-shape: squircle;
            }

            border: 2px solid var(--separator);
            transition: border-color 0.2s ease;

            &:focus {
              border-color: var(--colors-blue);
            }
          }

          &.completed {
            opacity: 0.7;
            transform: scale(0.98);

            & > p {
              text-decoration: line-through;
              color: #6b7280;
            }

            .delete-button {
              opacity: 0.5;
            }
          }
        }
      }

      .empty-state {
        height: 100%;
        color: #9ca3af;
        text-align: center;
        @include make-flex();

        p {
          margin: 0;

          &:first-child {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          &.empty-hint {
            opacity: 0.7;
            font-size: 12px;
            margin-bottom: 7px;
          }
        }
      }
    }
  }

  @keyframes fadeout {
    from {
      opacity: 1;
      max-height: 30px;
      overflow: hidden;
      min-height: auto;
    }
    to {
      opacity: 0;
      max-height: 0px;
      overflow: hidden;
      min-height: auto;
    }
  }

  // @keyframes vertical-scroll-shadow {
  //   /* start: content below → shadow at bottom */
  //   from {
  //     box-shadow: inset 0 -16px 16px -12px rgb(0 0 0 / 0.35);
  //   }

  //   /* middle: content above + below */
  //   50% {
  //     box-shadow:
  //       inset 0 -16px 16px -12px rgb(0 0 0 / 0.35),
  //       inset 0 16px 16px -12px rgb(0 0 0 / 0.35);
  //   }

  //   /* end: content above → shadow at top */
  //   to {
  //     box-shadow: inset 0 16px 16px -12px rgb(0 0 0 / 0.35);
  //   }
  // }
</style>

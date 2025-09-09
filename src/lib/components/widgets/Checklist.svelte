<script lang="ts">
  import { onMount } from "svelte";
  import {
    draggable,
    type DraggableOptions,
  } from "../../actions/draggable.svelte";
  import {
    resizable,
    type ResizableOptions,
  } from "../../actions/resizable.svelte";
  import { X } from "@lucide/svelte";
  import settingStore from "../../../lib/stores/settingStore";
  import type { ChecklistSpan, ChecklistItem } from "../../stores/settingStore";

  interface Props {
    id: string;
    pos: {
      row: number;
      col: number;
    };
    span: ChecklistSpan;
    settings: {
      items: ChecklistItem[];
    };
    onDragEnd: (newRow: number, newCol: number) => void;
    onResize: (newSpan: ChecklistSpan) => void;
  }

  let {
    id,
    pos = { row: 1, col: 1 },
    span = { x: 2, y: 2 },
    settings,
    onDragEnd = (_newRow: number, _newCol: number) => {},
    onResize = (_newSpan: ChecklistSpan) => {},
  }: Props = $props();

  // Current position and size state
  let currentGridRow = $state(pos.row);
  let currentGridCol = $state(pos.col);
  let currentSpanX = $state(span.x);
  let currentSpanY = $state(span.y);

  // Checklist state
  let items = $state<ChecklistItem[]>(settings.items || []);
  let showInput = $state(false);
  let inputValue = $state("");
  let inputElement = $state<HTMLInputElement>();
  let editingItemId = $state<string | null>(null);
  let editValue = $state("");
  let editInputElement = $state<HTMLInputElement>();

  // Handle drag end to update position
  function handleDragEnd(newRow: number, newCol: number) {
    currentGridRow = newRow;
    currentGridCol = newCol;
    onDragEnd(newRow, newCol);
  }

  // Handle resize to update size (only 2x2 allowed)
  function handleResize(_newSpanX: number, _newSpanY: number) {
    const newSpan = { x: 2, y: 2 } as ChecklistSpan; // Force 2x2
    currentSpanX = newSpan.x;
    currentSpanY = newSpan.y;
    onResize(newSpan);
  }

  // Draggable options
  const draggableOptions: DraggableOptions = {
    onDragEnd: handleDragEnd,
  };

  // Resizable options (only 2x2 allowed)
  const resizableOptions: ResizableOptions = {
    allowedSizes: ["2x2"],
    onResize: handleResize,
  };

  // Show input for adding new item
  function showAddInput() {
    showInput = true;
    // Focus the input after it's rendered
    setTimeout(() => {
      inputElement?.focus();
    }, 0);
  }

  // Hide input
  function hideInput() {
    showInput = false;
    inputValue = "";
  }

  // Add new item to checklist
  function addItem() {
    if (inputValue.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
      };

      // Add to the beginning of the list
      items = [newItem, ...items];

      // Update the settings store
      updateSettings();

      hideInput();
    }
  }

  // Toggle item completion
  function toggleItem(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.completed = !item.completed;

      if (item.completed) {
        // Add strikethrough, then remove after animation
        setTimeout(() => {
          items = items.filter((i) => i.id !== itemId);
          updateSettings();
        }, 500);
      }

      // Trigger reactivity
      items = [...items];
      updateSettings();
    }
  }

  // Delete item
  function deleteItem(itemId: string) {
    items = items.filter((i) => i.id !== itemId);
    updateSettings();
  }

  // Start editing an item
  function startEdit(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      editingItemId = itemId;
      editValue = item.text;
      // Focus the edit input after it's rendered
      setTimeout(() => {
        editInputElement?.focus();
        editInputElement?.select();
      }, 0);
    }
  }

  // Cancel editing
  function cancelEdit() {
    editingItemId = null;
    editValue = "";
  }

  // Save edited item
  function saveEdit() {
    if (editValue.trim() && editingItemId) {
      const item = items.find((i) => i.id === editingItemId);
      if (item) {
        item.text = editValue.trim();
        items = [...items]; // Trigger reactivity
        updateSettings();
      }
    }
    cancelEdit();
  }

  // Update settings in store
  function updateSettings() {
    settingStore.update((store) => {
      if (store.widgets[id]) {
        store.widgets[id].settings = { items };
      }
      return store;
    });
  }

  // Handle key events for input
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    } else if (event.key === "Escape") {
      event.preventDefault();
      hideInput();
    }
  }

  // Handle key events for edit input
  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  onMount(() => {
    // Sync items with settings on mount
    items = settings.items || [];
  });
</script>

<div
  {id}
  role="region"
  class="Checklist BlurBG"
  data-isolate-context="true"
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  oncontextmenu={(event: MouseEvent) => {
    event.preventDefault();
    showAddInput();
  }}
  class:draggable-widget={$settingStore.options.isDraggable}
  style="grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow +
    currentSpanY} / {currentGridCol + currentSpanX};"
>
  <div class="Checklist__container">
    <!-- Input for new item -->
    {#if showInput}
      <div class="Checklist__input">
        <input
          type="text"
          onblur={hideInput}
          bind:value={inputValue}
          bind:this={inputElement}
          onkeydown={handleKeydown}
          placeholder="Enter new task..."
        />
      </div>
    {/if}

    <!-- Items List -->
    <div class="Checklist__items">
      {#each items as item (item.id)}
        <div class="Checklist__items--item" class:completed={item.completed}>
          <input
            type="checkbox"
            checked={item.completed}
            onchange={() => toggleItem(item.id)}
          />

          {#if editingItemId === item.id}
            <!-- Edit mode -->
            <input
              type="text"
              onblur={saveEdit}
              bind:value={editValue}
              bind:this={editInputElement}
              onkeydown={handleEditKeydown}
            />
          {:else}
            <!-- Normal mode -->
            <span
              tabindex="0"
              role="button"
              class="item-text"
              aria-label={`Edit ${item.text}`}
              ondblclick={() => startEdit(item.id)}
            >
              {item.text}
            </span>

            <button
              class="delete-button"
              onclick={() => deleteItem(item.id)}
              title="Delete item"
            >
              <X size="14" />
            </button>
          {/if}
        </div>
      {/each}

      {#if items.length === 0 && !showInput}
        <div class="empty-state" data-isolate-context="true">
          <p>No tasks yet</p>
          <p class="empty-hint">Right-click to add a new task</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @use "../../../styles/mixins.scss" as *;

  .Checklist {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;

    & > * {
      user-select: none;
    }

    &__container {
      padding: 10px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }

    &__input {
      flex-shrink: 0;
      & > input {
        width: 100%;
        padding: 8px 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        background: white;
        color: #374151;
        outline: none;
        transition: border-color 0.2s ease;

        &:focus {
          border-color: #10b981;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }
    }

    &__items {
      flex: 1;
      gap: 7px;
      min-height: 0;
      display: flex;
      overflow-y: auto;
      padding-right: 4px;
      margin-right: -7px;
      flex-direction: column;
      scrollbar-gutter: stable;

      /* Custom scrollbar */
      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      &--item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 8px;
        border-radius: 8px;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.1);
        position: relative;

        &:hover {
          background: rgba(255, 255, 255, 0.8);

          .delete-button {
            opacity: 1;
            visibility: visible;
          }
        }

        &.completed {
          opacity: 0.7;
          transform: scale(0.98);

          .item-text {
            text-decoration: line-through;
            color: #6b7280;
          }

          .item-checkbox {
            accent-color: #10b981;
          }

          .delete-button {
            opacity: 0.5;
          }
        }

        & > input[type="checkbox"] {
          @include box(13px, 13px);
          cursor: pointer;
          accent-color: #10b981;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }
  }

  .item-text {
    flex: 1;
    font-size: 14px;
    color: #374151;
    line-height: 1.4;
    word-break: break-word;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      color: #1f2937;
    }
  }

  .edit-item-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid #10b981;
    border-radius: 4px;
    font-size: 14px;
    background: white;
    color: #374151;
    outline: none;
    font-family: inherit;
    @include box(100%, 100%);
  }

  .delete-button {
    background: #ef4444;
    border: none;
    border-radius: 4px;
    @include box(18px, 18px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.2s ease;
    opacity: 0;
    visibility: hidden;
    flex-shrink: 0;

    &:hover {
      background: #dc2626;
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #9ca3af;
    text-align: center;

    p {
      margin: 0;

      &:first-child {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      &.empty-hint {
        font-size: 12px;
        opacity: 0.7;
      }
    }
  }
</style>

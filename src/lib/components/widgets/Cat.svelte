<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from "svelte";
  import type { CatImage } from "@/lib/utils/CatEngine";
  import BlurredSpinner from "../BlurredSpinner.svelte";
  import type { CatSpan } from "../../stores/settingStore";
  import settingStore from "../../../lib/stores/settingStore";
  import { catStoreActions, catImageStates } from "../../stores/catStore";
  import {
    draggable,
    type DraggableOptions,
  } from "../../actions/draggable.svelte";
  import {
    resizable,
    type ResizableOptions,
  } from "../../actions/resizable.svelte";
  import {
    dissolve,
    type DissolveOptions,
  } from "../../actions/dissolve.svelte";
  import { Minus, Pen, PenLine } from "@lucide/svelte";

  interface Props {
    id: string;
    pos: {
      row: number;
      col: number;
    };
    span: CatSpan;
    settings: Record<string, any>;
    isEditable?: boolean;
    onResize: (newSpan: CatSpan) => void;
    onDragEnd: (newRow: number, newCol: number) => void;
    onRemove?: () => void;
    openSettings?: (widgetId: string) => void;
  }

  let {
    id,
    pos,
    span,
    settings,
    onResize,
    onDragEnd,
    isEditable = false,
    onRemove,
    openSettings,
  }: Props = $props();

  let imgSrc = $state<CatImage>({
    imageUrl: "",
    title: "",
    subreddit: "",
    postUrl: "",
    author: "",
    source: "",
  });

  // Get the cached image state for this widget
  const widgetCacheState = $derived($catImageStates[id]);

  // Update imgSrc when cache state changes
  $effect(() => {
    if (widgetCacheState?.image) {
      imgSrc = widgetCacheState.image;
    }
  });

  const isLoading = $derived(widgetCacheState?.isLoading ?? true);
  const hasError = $derived(!!widgetCacheState?.error);

  // Current position and size state
  let currentGridRow = $state(pos.row);
  let currentGridCol = $state(pos.col);
  let currentSpanX = $state(span.x);
  let currentSpanY = $state(span.y);

  let tooLong = $state(false);
  let sizeType = $derived(span.x === 1 && span.y === 1 ? "small" : "large");
  let shouldDissolve = $state(false);

  // Dissolve options
  const dissolveOptions = $derived({
    trigger: shouldDissolve,
    onComplete: () => {
      onRemove?.();
    },
    duration: 300,
  });

  // Function to refresh the cat image
  async function refreshImage() {
    try {
      const newImage = await catStoreActions.refreshCatImage(id);
      imgSrc = newImage;
      tooLong = false; // Reset the too long state on successful refresh
    } catch (error) {
      console.error("Failed to refresh cat image:", error);
    }
  }

  // Function to trigger dissolve effect
  function triggerDissolve() {
    shouldDissolve = true;
  }

  // Handle drag end
  function handleDragEnd(newRow: number, newCol: number) {
    currentGridRow = newRow;
    currentGridCol = newCol;
    onDragEnd(newRow, newCol);
  }

  // Handle resize
  function handleResize(newSpanX: number, newSpanY: number) {
    // Type assertion to ensure only valid combinations are allowed
    const newSpan = { x: newSpanX, y: newSpanY } as CatSpan;
    currentSpanX = newSpan.x;
    currentSpanY = newSpan.y;
    onResize(newSpan);
  }

  // Draggable options
  const draggableOptions: DraggableOptions = {
    onDragEnd: handleDragEnd,
  };

  // Resizable options
  const resizableOptions: ResizableOptions = {
    allowedSizes: ["1x1", "2x2"],
    onResize: handleResize,
  };

  onMount(() => {
    const timer = setTimeout(() => {
      tooLong = true;
    }, 2500);
    return () => clearTimeout(timer);
  });

  onMount(async () => {
    try {
      const cachedImage = await catStoreActions.getCatImage(id);
      imgSrc = cachedImage;
    } catch (err) {
      console.error("Error getting cat image:", err);
      imgSrc = {
        imageUrl: "",
        title: "Failed to load cat image",
        subreddit: "",
        postUrl: "",
        author: "",
        source: "",
      };
    }
  });
</script>

<div
  {id}
  class="CatBox BlurBG"
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  use:dissolve={dissolveOptions}
  class:draggable-widget={$settingStore.options.isDraggable}
  style="
    background-image: url({imgSrc.imageUrl});
    grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow +
    currentSpanY} / {currentGridCol + currentSpanX};
  "
>
  {#if !imgSrc.imageUrl}
    <BlurredSpinner zIndex={-2}>
      {#if tooLong && !isLoading}
        <h3 class="CatBox--tooLong">
          <em>Can't find a free cat, refresh the page!</em>
        </h3>
      {:else if hasError}
        <div class="CatBox--error">
          <h3><em>Failed to load cat image</em></h3>
          <button onclick={refreshImage} class="retry-btn">Try Again</button>
        </div>
      {/if}
    </BlurredSpinner>
  {/if}

  {#if isEditable && onRemove}
    <div class="EditableOverlay BlurBG">
      <button
        class="remove-button BlurBG"
        onclick={triggerDissolve}
        title="Remove widget"
        data-isolate-drag
      >
        <Minus size="18" />
      </button>
      <button
        class="edit-button BlurBG"
        onclick={() => openSettings?.(id)}
        title="Edit widget"
        data-isolate-drag
      >
        <PenLine size="13" />
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../../styles/mixins.scss" as *;

  .CatBox {
    color: #e4e4e4;
    position: relative;
    border-radius: 20px;
    background-size: cover;
    background-position: center;
    @include make-flex($just: flex-end);
    box-shadow: 0 0 20px 1px #00000087;

    // Let the widget grid system control dimensions
    @include box();
    // min-height: 120px; // Ensure minimum usability

    &--tooLong {
      z-index: -1;
      padding: 0 20px;
      text-align: center;
    }

    &--error {
      z-index: 1;
      padding: 20px;
      color: #ff6b6b;
      text-align: center;
    }

    &:hover {
      .CatBox__details {
        opacity: 1;
      }
    }

    &__details {
      width: 100%;
      padding: 20px;
      min-height: 80px; // Responsive height
      overflow: hidden;
      position: relative;
      border-radius: 0 0 20px 20px;

      opacity: 0;
      transition: opacity 0.3s ease-in-out;

      &::after {
        content: "";
        left: -30px;
        z-index: -1;
        bottom: -50px;
        position: absolute;
        @include box(111%, 100%);
        background: rgba(0, 0, 0, 0.87);
        filter: blur(17.149999618530273px);
        border-radius: 0px 0px 20px 20px;
      }

      @include make-flex($align: flex-start, $just: flex-end);
      gap: 10px;
      z-index: 1;

      h4 {
        font-size: 14px;
        font-weight: 400;
        a {
          color: #c0c0c0;
          text-decoration: underline;
          &:hover {
            color: #e4e4e4;
          }
        }
      }

      h2 {
        font-size: 16px;
        font-weight: 500;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .CatBox:hover {
    opacity: 1;
  }
</style>

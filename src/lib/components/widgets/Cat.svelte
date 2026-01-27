<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { CatEngine } from "@/lib/modules/cats/cats.engine";
  import { CatStore } from "@/lib/modules/cats/cats.stores";
  import BlurredSpinner from "../Spinner/BlurredSpinner.svelte";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type { CatWidget, CatSpan } from "@/lib/modules/widgets/widgets.types";

  let {
    widget,
  }: {
    widget: CatWidget;
  } = $props();

  const config = $state<{
    size: "compact" | "large";
    allowedSpans: CatSpan[];
    resizeProgress: "idle" | "resizing";
  }>({
    // svelte-ignore state_referenced_locally
    size: widget.span.x === 1 && widget.span.y === 1 ? "compact" : "large",
    allowedSpans: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
    resizeProgress: "idle" as "idle" | "resizing",
  });

  let tooLong = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let storeUnsubscribe: (() => void) | undefined;
  let hasIncrementedOnMount = $state(false);

  // Reactively get the current cat from the store without incrementing timesAccessed
  let currentCat = $derived.by(() => {
    const store = $CatStore;
    const widgetStore = store.widgets[widget.id!];
    if (!widgetStore || widgetStore.magazine.length === 0) {
      return null;
    }
    // Just read the first item from magazine without popping/incrementing
    const magazine = CatStore.getMagazine(widget.id!);
    return magazine?.getLatestItem(true) ?? null; // Pass true to not increment
  });

  onMount(() => {
    // Initialize magazine for this widget
    CatStore.initMagazine(widget.id!, {
      magazineSize: widget.settings.magazineSize ?? 7,
      maxAccess: widget.settings.maxAccess ?? 1,
    });

    // Immediately increment timesAccessed if magazine already has items
    // This prevents the visual glitch of showing the old image
    const magazine = CatStore.getMagazine(widget.id!);
    if (magazine && magazine.getAllItems().length > 0 && !hasIncrementedOnMount) {
      CatEngine.getCat(widget.id!); // Increment immediately
      hasIncrementedOnMount = true;
      tooLong = false;
    } else {
      // If no items yet, wait a bit for them to load
      setTimeout(() => {
        if (!hasIncrementedOnMount) {
          const cat = CatEngine.getCat(widget.id!);
          hasIncrementedOnMount = true;
          if (cat) {
            tooLong = false;
          }
        }
      }, 100);
    }

    // Set up timeout for showing "too long" message
    timer = setTimeout(() => {
      tooLong = true;
    }, 2500);

    // Subscribe to store changes to clear the timer when cat becomes available
    storeUnsubscribe = CatStore.subscribe((store) => {
      const widgetStore = store.widgets[widget.id!];
      if (widgetStore && widgetStore.magazine.length > 0 && timer) {
        clearTimeout(timer);
        tooLong = false;
      }
    });
  });

  onDestroy(() => {
    // Clear timeout to prevent memory leak
    if (timer) {
      clearTimeout(timer);
    }
    // Unsubscribe from store
    if (storeUnsubscribe) {
      storeUnsubscribe();
    }
    // Note: We don't call removeMagazine here because the widget data
    // should persist in localStorage. Cleanup happens in WidgetEngine.removeWidget
  });
</script>

<div
  class="cat-box blur-thin"
  use:draggable={widget.id!}
  use:resizable={{
    widgetId: widget.id!,
    spans: config.allowedSpans,
    onResizeStateChange: (resizeState) =>
      (config.resizeProgress = resizeState.type),
    onResize: (newSpan) => {
      // Update size based on new span
      config.size = newSpan.x === 1 && newSpan.y === 1 ? "compact" : "large";
    },
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
    background-image: url('{currentCat?.imageUrl}');
  "
>
  {#if !currentCat && tooLong}
    <BlurredSpinner className="cat-spinner">
      {#if config.size === "large"}
        <h3>
          <em>Cats are napping,<br /> please wait...</em>
        </h3>
      {/if}
    </BlurredSpinner>
  {:else if !currentCat}
    <BlurredSpinner className="cat-spinner" />
  {/if}
</div>

<style lang="scss">
  .cat-box {
    border-radius: 20px;
    @include make-flex();
    background-size: cover;
    background-position: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    :global(.cat-spinner) {
      padding: 20px;
    }

    h3 {
      padding: 0 10px;
      text-align: center;

      em {
        font-weight: 400;
        line-height: 1.4;
        font-style: normal;
        margin-bottom: -2px;
      }
      color: var(--colors-red);
    }
  }
</style>

<!-- Options
- Frames: None, some good frames 

-->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { ImageStore } from "@/lib/modules/image/image.store";
  import {
    AICEngineImpl,
    type AICArtworkResponse,
  } from "@/lib/modules/image/engines/aic.engine";
  import { NGAEngineImpl } from "@/lib/modules/image/engines/nga.engine";
  import type { ImageResponse } from "@/lib/modules/image/image.engine";
  import BlurredSpinner from "../Spinner/BlurredSpinner.svelte";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type {
    ArtGalleryWidget,
    ArtGallerySpan,
  } from "@/lib/modules/widgets/widgets.types";
  import { Expand } from "@lucide/svelte";

  let {
    widget,
  }: {
    widget: ArtGalleryWidget & { isDemo?: boolean };
  } = $props();

  const config = $state<{
    size: "standard" | "large" | "xlarge";
    allowedSpans: ArtGallerySpan[];
    resizeProgress: "idle" | "resizing";
  }>({
    // svelte-ignore state_referenced_locally
    size:
      widget.span.x === 2 && widget.span.y === 2
        ? "standard"
        : widget.span.x >= 4
          ? "xlarge"
          : "large",
    allowedSpans: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
    ],
    resizeProgress: "idle" as "idle" | "resizing",
  });

  let tooLong = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let storeUnsubscribe: (() => void) | undefined;
  let hasIncrementedOnMount = $state(false);

  // Get the appropriate engine based on widget settings
  const engine = $derived(
    widget.settings.source === "aic"
      ? new AICEngineImpl()
      : new NGAEngineImpl(),
  );

  // Reactively get the current artwork from the store without incrementing timesAccessed
  // Type is narrowed based on the source setting
  let currentArtwork = $derived.by(
    (): (AICArtworkResponse | ImageResponse) | null => {
      if (widget.isDemo) {
        return {
          id: "demo",
          source: "aic",
          imageUrl:
            "https://www.artic.edu/iiif/2/831a05de-d3f6-f4fa-a460-23008dd58dda/full/843,/0/default.jpg",
          thumbnailUrl: null,
          title: "Demo Artwork",
          artist: "Demo Artist",
          date: "2024",
          description: null,
          downloadUrl: null,
          thumbnail: null,
          tags: [],
          sourceUrl: null,
        } as AICArtworkResponse;
      }

      const store = $ImageStore;
      const widgetStore = store.widgets[widget.id!];
      if (!widgetStore || widgetStore.magazine.length === 0) {
        return null;
      }
      // Just read the first item from magazine without popping/incrementing
      const magazine = ImageStore.getMagazine(widget.id!);
      const item = magazine?.getLatestItem(true) ?? null; // Pass true to not increment

      // Return with proper type based on source
      return item as
        | (typeof widget.settings.source extends "aic"
            ? AICArtworkResponse
            : ImageResponse)
        | null;
    },
  );

  onMount(() => {
    // Skip initialization if using demo image or in demo mode
    if (widget.isDemo) {
      return;
    }

    // Initialize magazine for this widget
    ImageStore.initMagazine(
      widget.id!,
      {
        magazineSize: widget.settings.magazineSize ?? 10,
        maxAccess: widget.settings.maxAccess ?? 1,
      },
      engine,
      { tag: "", options: {} }, // Empty tag for random selection
    );

    // Immediately increment timesAccessed if magazine already has items
    const magazine = ImageStore.getMagazine(widget.id!);
    if (
      magazine &&
      magazine.getAllItems().length > 0 &&
      !hasIncrementedOnMount
    ) {
      magazine.getLatestItem(); // Increment immediately
      hasIncrementedOnMount = true;
      tooLong = false;
    } else {
      // If no items yet, wait a bit for them to load
      setTimeout(() => {
        if (!hasIncrementedOnMount) {
          const mag = ImageStore.getMagazine(widget.id!);
          if (mag) {
            mag.getLatestItem();
            hasIncrementedOnMount = true;
            tooLong = false;
          }
        }
      }, 100);
    }

    // Set up timeout for showing "too long" message
    timer = setTimeout(() => {
      tooLong = true;
    }, 2500);

    // Subscribe to store changes to clear the timer when artwork becomes available
    storeUnsubscribe = ImageStore.subscribe((store) => {
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
  });
</script>

<div
  class="art-gallery blur-thin"
  data-size={config.size}
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  use:resizable={{
    widgetId: widget.id!,
    spans: config.allowedSpans,
    onResizeStateChange: (resizeState) =>
      (config.resizeProgress = resizeState.type),
    onResize: (newSpan) => {
      // Update size based on new span
      config.size =
        newSpan.x === 2 && newSpan.y === 2
          ? "standard"
          : newSpan.x >= 4
            ? "xlarge"
            : "large";
    },
    isDemo: widget.isDemo,
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
    background-image: url('{currentArtwork?.imageUrl}');
  "
>
  {#if !currentArtwork && tooLong}
    <BlurredSpinner className="art-spinner">
      {#if config.size !== "standard"}
        <h3>
          <em>Loading artwork,<br /> please wait...</em>
        </h3>
      {/if}
    </BlurredSpinner>
  {:else if !currentArtwork}
    <BlurredSpinner className="art-spinner" />
  {:else}
    <div class="artwork-info">
      <div class="artwork-title">{currentArtwork.title}</div>
      {#if currentArtwork.artist}
        <div class="artwork-artist">{currentArtwork.artist}</div>
      {/if}
      {#if currentArtwork.date}
        <div class="artwork-date">{currentArtwork.date}</div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .art-gallery {
    @include box();
    border-radius: 20px;
    @include make-flex();
    background-size: cover;
    background-position: center;
    position: relative;
    
    // Use inset shadow instead of regular shadow to avoid overflow:hidden
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1),
                inset 0 2px 8px rgba(0, 0, 0, 0.15);

    :global(.art-spinner) {
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

    .artwork-info {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 15px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 0 0 20px 20px;
      pointer-events: none;
    }

    &:hover .artwork-info {
      opacity: 1;
    }

    .artwork-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .artwork-artist {
      font-size: 12px;
      opacity: 0.9;
    }

    .artwork-date {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 2px;
    }

    .resize-progress {
      @include make-flex();
    }
  }
</style>

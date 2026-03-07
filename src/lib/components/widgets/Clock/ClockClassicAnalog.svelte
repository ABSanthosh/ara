<script lang="ts">
  import { onMount } from "svelte";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import { flippable } from "@/lib/modules/widgets/utils/flippable.svelte";
  import type {
    ClockWidgetClassicAnalog,
    ClockWidgetClassicAnalogSpan,
  } from "@/lib/modules/widgets/widgets.types";
  import { Expand } from "@lucide/svelte";
  import dayjs from "dayjs";
  import { GlobalTimer } from "@/lib/modules/widgets/shared-time.store";

  let {
    widget,
  }: {
    widget: ClockWidgetClassicAnalog & { isDemo?: boolean };
  } = $props();

  // svelte-ignore state_referenced_locally
  const widgetId = widget.id!;

  let date = $state(dayjs());
  const timeFormats = $derived({
    hours: date.hour(),
    minutes: date.minute(),
    seconds: date.second(),
  });

  onMount(() => {
    // Skip interval if in demo mode
    if (widget.isDemo) {
      return;
    }

    GlobalTimer.register(widget.id!, () => {
      date = dayjs();
    });

    return () => {
      GlobalTimer.unregister(widgetId);
    };
  });

  const config = $state<{
    size: "compact" | "large";
    allowedSpans: ClockWidgetClassicAnalogSpan[];
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

  let isFlipped = $state(false);
</script>

{#snippet front()}
  <div class="widget-front-face">
    {#if config.resizeProgress === "idle"}
      <svg viewBox="-50 -50 100 100">
        <circle class="AnalogClock__face" r="48" />
        {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
          <line
            y2="45"
            class="AnalogClock__major"
            transform="rotate({30 * minute})"
            y1={config.size === "compact" ? "40" : "42"}
          />
          {#if config.size === "large"}
            <text
              fill="black"
              text-anchor="middle"
              x={36 * Math.sin((Math.PI / 30) * minute)}
              y={-36 * Math.cos((Math.PI / 30) * minute) + 3}
            >
              {#if minute == 0}
                12
              {:else}
                {minute / 5}
              {/if}
            </text>
          {/if}

          {#each [1, 2, 3, 4] as offset}
            <line
              y1={config.size === "compact" ? "40" : "42"}
              y2="45"
              class="AnalogClock__minor"
              transform="rotate({6 * (minute + offset)})"
            />
          {/each}
        {/each}

        <!-- City name and timezone offset in center -->
        {#if widget.settings.city && config.size === "large"}
          <text x="0" y="-12" text-anchor="middle" class="AnalogClock__city-text">
            <!-- {cityAbbr} -->
          </text>
          <text
            x="0"
            y="20"
            text-anchor="middle"
            class="AnalogClock__offset-text"
          >
            <!-- {offsetDisplay} -->
          </text>
        {/if}

        <!-- hour hand -->
        <g
          class="AnalogClock__hour"
          transform="rotate({30 * timeFormats.hours + timeFormats.minutes / 2})"
        >
          <line
            class="AnalogClock__hour--base"
            y1="0"
            y2={config.size === "compact" ? "-6" : "-8"}
          />
          <line
            class="AnalogClock__hour--line"
            y1={config.size === "compact" ? "-5" : "-7"}
            y2={config.size === "compact" ? "-20" : "-26"}
          />
          <circle r={config.size === "compact" ? "1.5" : "2"} />
        </g>

        <!-- minute hand -->
        <g
          class="AnalogClock__minute"
          transform="rotate({6 * timeFormats.minutes + timeFormats.seconds / 10})"
        >
          <line
            class="AnalogClock__minute--base"
            y1="0"
            y2={config.size === "compact" ? "-8" : "-12"}
          />
          <line
            class="AnalogClock__minute--line"
            y1={config.size === "compact" ? "-5" : "-7"}
            y2={config.size === "compact" ? "-32" : "-40"}
          />
        </g>

        <!-- second hand -->
        <g
          class="AnalogClock__second"
          transform="rotate({6 * timeFormats.seconds})"
        >
          <line
            class="AnalogClock__second--line"
            y1={config.size === "compact" ? "4" : "6"}
            y2={config.size === "compact" ? "-38" : "-44"}
          />
          <circle r={config.size === "compact" ? "0.8" : "1"} />
        </g>
        <circle r={config.size === "compact" ? "0.5" : "0.7"} />
      </svg>
    {:else}
      <div class="resize-progress">
        <Expand size="24" color="var(--views-thicker)" />
      </div>
    {/if}
  </div>
{/snippet}

{#snippet back()}
  <div class="widget-back-face">
    <div class="widget-back-face__content">
      <h3>Clock Settings</h3>
      <div class="setting-group">
        <label>
          <input type="checkbox" checked={widget.settings.showNumbers} />
          Show Numbers
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" checked={widget.settings.showSecondsHand} />
          Show Seconds Hand
        </label>
      </div>
      <div class="setting-group">
        <label for="city-{widget.id}">City:</label>
        <input id="city-{widget.id}" type="text" value={widget.settings.city} placeholder="City name" />
      </div>
    </div>
  </div>
{/snippet}

<div
  data-size={config.size}
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  class="AnalogClock blur-thin"
  use:resizable={{
    widgetId: widget.id!,
    spans: config.allowedSpans,
    onResizeStateChange: (resizeState) =>
      (config.resizeProgress = resizeState.type),
    onResize: (newSpan) => {
      // Update size based on new span
      config.size = newSpan.x === 1 && newSpan.y === 1 ? "compact" : "large";
    },
    isDemo: widget.isDemo,
  }}
  use:flippable={{
    widgetId: widget.id!,
    isDemo: widget.isDemo,
    onFlip: () => (isFlipped = true),
    onFlipBack: () => (isFlipped = false),
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
  "
>
  {@render front()}
  {@render back()}
</div>

<style lang="scss">
  .AnalogClock {
    padding: 6px;
    @include box();
    position: relative;
    border-radius: 22px;
    border: 1px solid var(--separator-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .widget-front-face {
      @include box();
      backface-visibility: hidden;
      transform: rotateY(0deg);
      border-radius: 22px;
    }

    .widget-back-face {
      @include box();
      @include make-flex();
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.49);
      backdrop-filter: blur(26px) saturate(170%) brightness(1.04);
      border-radius: 22px;
      backface-visibility: hidden;
      transform: rotateY(180deg);
      pointer-events: none;

      &__content {
        color: white;
        padding: 20px;
        width: 100%;
        max-height: 100%;
        overflow-y: auto;

        h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .setting-group {
          margin-bottom: 15px;

          label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            font-size: 12px;
            opacity: 0.8;
            cursor: pointer;

            input[type="checkbox"] {
              width: auto;
            }
          }

          select, input[type="text"], input[type="number"] {
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 14px;

            &:focus {
              outline: none;
              border-color: var(--widget-color, #6366f1);
            }
          }
        }
      }
    }

    & > * {
      user-select: none;
    }

    &[data-size="compact"] {
      padding: 4px;
    }

    // SVG Container
    & > svg {
      @include box();
      aspect-ratio: 1;
      max-width: 100%;
      max-height: 100%;

      & > circle {
        fill: var(--colors-white-labels);
      }
    }

    // Clock Face
    &__face {
      fill: var(--colors-white-labels);
    }

    // Hour Markers
    &__major,
    &__minor {
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &__major {
      stroke: #333;
      stroke-width: 1;
    }

    &__minor {
      stroke: var(--vibrant-labels-secondary);
      stroke-width: 0.5;
    }

    // Hour Numbers
    text {
      font-weight: 600;
      font-size: clamp(4px, 1.2vw, 8px);
    }

    // Hour Hand
    &__hour {
      --color: #1f1f1f;

      & > circle {
        stroke: var(--color);
      }

      &--base {
        stroke: var(--color);
        stroke-width: 1.5;
      }

      &--line {
        stroke: #111111;
        stroke-width: 3.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
      }
    }

    // Minute Hand
    &__minute {
      --color: #1f1f1f;

      &--base {
        stroke: var(--color);
        stroke-width: 1.5;
      }

      &--line {
        stroke: #111111;
        stroke-width: 3.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
      }
    }

    // Second Hand
    &__second {
      &--line {
        stroke: #ff0000;
        stroke-width: 1;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.2));
      }

      & > circle {
        fill: #ff0000;
        stroke: #ff0000;
      }
    }

    // City & Timezone Labels
    &__city-text {
      font-size: 10px;
    }

    &__offset-text {
      font-size: 8px;
    }
  }
</style>

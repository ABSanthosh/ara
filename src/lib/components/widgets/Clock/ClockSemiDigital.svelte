<script lang="ts">
  import { onMount } from "svelte";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type {
    ClockWidgetSemiDigital,
    ClockWidgetSemiDigitalSpan,
  } from "@/lib/modules/widgets/widgets.types";
  import dayjs from "dayjs";
  import { GlobalTimer } from "@/lib/modules/widgets/shared-time.store";
  import { Expand } from "@lucide/svelte";

  let {
    widget,
  }: {
    widget: ClockWidgetSemiDigital & { isDemo?: boolean };
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
    // Skip timer registration if in demo mode
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
    allowedSpans: ClockWidgetSemiDigitalSpan[];
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

  const tickHeight = $derived(config.size === "large" ? 5 : 5);
  const tickOffset = 46; // Distance from center to start of ticks
  const tickCenterOffset = 50; // Distance from center to center of ticks
  const waveLength = 30; // Number of ticks affected by the wave

  // Pre-calculate tick positions to avoid recalculating on every render
  const tickPositions = $derived.by(() => {
    const positions: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      index: number;
    }> = [];

    // Top edge ticks
    for (let tick = 0; tick < 15; tick++) {
      const x1 = -tickOffset + (tick * (tickOffset * 2)) / 14;
      const y1 = -tickCenterOffset;
      const dist = Math.sqrt(x1 * x1 + y1 * y1);
      const angle = Math.atan2(y1, x1);
      const adjustedLength = tickHeight / Math.abs(Math.sin(angle));
      const x2 = (x1 * (dist - adjustedLength)) / dist;
      const y2 = (y1 * (dist - adjustedLength)) / dist;
      positions.push({ x1, y1, x2, y2, index: tick });
    }

    // Right edge ticks
    for (let tick = 0; tick < 15; tick++) {
      const x1 = tickCenterOffset;
      const y1 = -tickOffset + (tick * (tickOffset * 2)) / 14;
      const dist = Math.sqrt(x1 * x1 + y1 * y1);
      const angle = Math.atan2(y1, x1);
      const adjustedLength = tickHeight / Math.abs(Math.cos(angle));
      const x2 = (x1 * (dist - adjustedLength)) / dist;
      const y2 = (y1 * (dist - adjustedLength)) / dist;
      positions.push({ x1, y1, x2, y2, index: 15 + tick });
    }

    // Bottom edge ticks
    for (let tick = 0; tick < 15; tick++) {
      const x1 = tickOffset - (tick * (tickOffset * 2)) / 14;
      const y1 = tickCenterOffset;
      const dist = Math.sqrt(x1 * x1 + y1 * y1);
      const angle = Math.atan2(y1, x1);
      const adjustedLength = tickHeight / Math.abs(Math.sin(angle));
      const x2 = (x1 * (dist - adjustedLength)) / dist;
      const y2 = (y1 * (dist - adjustedLength)) / dist;
      positions.push({ x1, y1, x2, y2, index: 30 + tick });
    }

    // Left edge ticks
    for (let tick = 0; tick < 15; tick++) {
      const x1 = -tickCenterOffset;
      const y1 = tickOffset - (tick * (tickOffset * 2)) / 14;
      const dist = Math.sqrt(x1 * x1 + y1 * y1);
      const angle = Math.atan2(y1, x1);
      const adjustedLength = tickHeight / Math.abs(Math.cos(angle));
      const x2 = (x1 * (dist - adjustedLength)) / dist;
      const y2 = (y1 * (dist - adjustedLength)) / dist;
      positions.push({ x1, y1, x2, y2, index: 45 + tick });
    }

    return positions;
  });

  // Function to calculate tick opacity based on distance from current second
  function getTickOpacity(tickIndex: number, currentSecond: number): number {
    // Calculate distance behind current second (considering wrap around)
    let distance = (currentSecond - tickIndex + 60) % 60;

    // Only apply wave to the 30 ticks trailing behind current second
    if (distance > waveLength) {
      return 0.15; // Base opacity for ticks outside wave
    }

    // Create fade effect: 1.0 (darkest) at current second, fading to 0.15
    return 1.0 - (distance / waveLength) * 0.85;
  }
</script>

<div
  data-size={config.size}
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  class="SemiDigital blur-thin"
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
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
  "
>
  {#if config.resizeProgress === "idle"}
    <svg viewBox="-52 -52 104 104">
      <rect
        x="-50"
        y="-50"
        width="100"
        height="100"
        rx="5"
        ry="5"
        fill="none"
      />
      <!-- All ticks rendered from pre-calculated positions -->
      {#each tickPositions as tick (tick.index)}
        <line
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          class="SemiDigital__tick"
          style="opacity: {getTickOpacity(tick.index, timeFormats.seconds)}"
        />
      {/each}

      <text text-anchor="middle" dominant-baseline="middle" x="0" y="0">
        <tspan
          x="0"
          dy="-30"
          class="label"
          font-size={config.size === "large" ? "10" : "13"}
        >
          {date.format("dddd")}
        </tspan>
        <tspan
          x="0"
          dx="2.5"
          dy={config.size === "large" ? "32" : "36"}
          font-size={"45px"}
          class="time"
        >
          {date.format("hh:mm")}
        </tspan>
        <tspan
          x="0"
          dy={config.size === "large" ? "30" : "28"}
          font-size={config.size === "large" ? "7" : "10"}
          class="utc"
        >
          UTC{date.format("Z")}
        </tspan>
      </text>
    </svg>
  {:else}
    <div class="resize-progress">
      <Expand size="24" color="var(--views-thicker)" />
    </div>
  {/if}
</div>

<style lang="scss">
  .SemiDigital {
    padding: 7px;
    @include box();
    position: relative;
    border-radius: 22px;
    background-color: #fff;
    border: 1px solid var(--separator-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    & > * {
      user-select: none;
    }

    &[data-size="compact"] {
      padding: 4px;

      & > svg {
        & > line {
          stroke-width: 2;
        }
      }
    }

    & > svg {
      border-radius: 15px;

      & > text {
        inset: 0;
        position: absolute;
        pointer-events: none;
        @include make-flex($gap: 6px);

        .label {
          font-weight: 600;
          fill: var(--vibrant-labels-secondary);
        }

        .utc {
          font-weight: 600;
          fill: var(--vibrant-labels-secondary);
        }

        .time {
          line-height: 1;
          font-weight: 700;
          transform-origin: center;
          fill: var(--vibrant-labels-quaternary);
          font-family: "Saira Extra Condensed", sans-serif;
        }
      }
    }

    &__tick {
      stroke-width: 1.1;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: opacity 0.5s ease-out;
      stroke: rgba(139, 139, 139, 0.879);
    }
  }
</style>

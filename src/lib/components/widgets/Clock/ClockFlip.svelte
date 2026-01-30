<script lang="ts">
  import { onMount } from "svelte";
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type {
    ClockWidgetFlip,
    ClockWidgetFlipSpan,
  } from "@/lib/modules/widgets/widgets.types";
  import { Expand } from "@lucide/svelte";
  import dayjs from "dayjs";
  import NumberFlow, { NumberFlowGroup } from "@number-flow/svelte";
  import { GlobalTimer } from "@/lib/modules/widgets/shared-time.store";

  let {
    widget,
  }: {
    widget: ClockWidgetFlip & { isDemo?: boolean };
  } = $props();

  // You need it to unregister the timer on destroy. For some reason, before we unregister, the value is destroyed so we need a local copy.
  // svelte-ignore state_referenced_locally
  const widgetId = widget.id!;
  let widgetElement: HTMLDivElement | null = $state(null);
  let date = $state(dayjs());

  // Derive time values as numbers
  const hh = $derived(date.hour() % 12 || 12);
  const mm = $derived(date.minute());
  const ss = $derived(date.second());

  const dateFormats = $derived({
    weekday: {
      allDays: Array.from({ length: 7 }, (_, i) =>
        date.startOf("week").add(i, "day").format("ddd"),
      ),
      long: date.format("dddd"),
      short: date.format("ddd"),
      narrow: date.format("dd"),
    },
    month: {
      calendarDays: [
        ...Array(date.startOf("month").day()).fill(null),
        ...Array.from({ length: date.daysInMonth() }, (_, i) =>
          date.date(i + 1).format("D"),
        ),
      ],
      long: date.format("MMMM"),
      short: date.format("MMM"),
      "2-digit": date.format("MM"),
    },
    date: {
      "2-digit": date.format("DD"),
    },
    year: {
      numeric: date.format("YYYY"),
      "2-digit": date.format("YY"),
    },
  });

  const config = $state<{
    size: "horizontal" | "vertical";
    allowedSpans: ClockWidgetFlipSpan[];
    resizeProgress: "idle" | "resizing";
  }>({
    // svelte-ignore state_referenced_locally
    size:
      widget.span.x === 2 && widget.span.y === 1 ? "horizontal" : "vertical",
    allowedSpans: [
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    resizeProgress: "idle",
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
</script>

<div
  data-size={config.size}
  class="FlipClock blur-thin"
  bind:this={widgetElement}
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  use:resizable={{
    widgetId: widget.id!,
    spans: config.allowedSpans,
    onResizeStateChange: (resizeState) =>
      (config.resizeProgress = resizeState.type),
    onResize: (newSpan) => {
      config.size =
        newSpan.x === 1 && newSpan.y === 2 ? "vertical" : "horizontal";
    },
    isDemo: widget.isDemo,
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
    --segment-width: {widgetElement
    ? `${
        widgetElement.clientWidth / (config.size === 'horizontal' ? 4 : 2) - 16
      }px`
    : '40px'};
  "
>
  {#if config.resizeProgress === "idle"}
    <NumberFlowGroup>
      <div class="clock-box">
        <div class="segment">
          <NumberFlow
            value={hh}
            format={{ minimumIntegerDigits: 2 }}
            trend={0}
          />
        </div>
        <div class="colon">:</div>
        <div class="segment">
          <NumberFlow
            value={mm}
            format={{ minimumIntegerDigits: 2 }}
            digits={{ 1: { max: 5 } }}
            trend={0}
          />
        </div>
        <div class="colon">:</div>
        <div class="segment">
          <NumberFlow
            value={ss}
            format={{ minimumIntegerDigits: 2 }}
            digits={{ 1: { max: 5 } }}
            trend={0}
          />
        </div>
      </div>
    </NumberFlowGroup>
    <div class="date-display">
      {dateFormats.weekday.short},
      {dateFormats.month.short}
      {dateFormats.date["2-digit"]},{" "}
      {dateFormats.year.numeric}
    </div>
  {:else}
    <div class="resize-progress">
      <Expand size="24" color="var(--views-thicker)" />
    </div>
  {/if}
</div>

<style lang="scss">
  .FlipClock {
    padding: 13px;
    @include box();
    border-radius: 20px;
    @include make-flex();
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--separator-secondary);

    & > * {
      user-select: none;
    }

    &[data-size="horizontal"] {
      gap: 15px;

      .clock-box {
        gap: 8px;
        flex-direction: row;
      }
      .segment {
        font-size: 45px;
      }
      .colon {
        margin-top: -6px;
        font-size: var(--segment-width);
      }
    }

    &[data-size="vertical"] {
      .clock-box {
        gap: 4px;
        height: 100%;
        flex-direction: column;
      }
      .segment {
        height: 50px;
        font-size: 45px;
      }
      .colon {
        display: none;
      }
    }
  }

  .clock-box {
    @include box($height: 50%);
    @include make-flex($dir: row, $gap: 8px);
  }

  .segment {
    height: 100%;
    color: white;
    overflow: hidden;
    min-width: 1.2em;
    position: relative;
    @include make-flex();
    border-radius: 8px;
    // padding: 4px 8px;
    line-height: 1;
    font-weight: 600;
    font-family: "JetBrains Mono", monospace;
    font-variant-numeric: tabular-nums;
    --number-flow-char-height: 0.85em;
  }

  .colon {
    color: white;
    width: 11px;
    line-height: 1;
    font-weight: 500;
    @include make-flex();
    animation: blink 1s infinite;
    font-family: "JetBrains Mono", monospace;
  }

  .date-display {
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    color: var(--vibrant-labels-primary);
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0.1;
    }
  }
</style>

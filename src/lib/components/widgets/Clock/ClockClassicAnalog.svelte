<script lang="ts">
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type {
    ClockWidgetClassicAnalog,
    ClockWidgetClassicAnalogSpan,
  } from "@/lib/modules/widgets/widgets.types";
  import { Expand } from "@lucide/svelte";
  import dayjs from "dayjs";

  let {
    widget,
  }: {
    widget: ClockWidgetClassicAnalog;
  } = $props();
  // TODO: Let users select different starting day of the week and locale
  const today = dayjs();

  let date = $state(dayjs());
  const timeFormats = $derived({
    hours: date.hour(),
    minutes: date.minute(),
    seconds: date.second(),
  });

  onMount(() => {
    const interval = setInterval(() => {
      date = dayjs();
      timeFormats.hours = date.hour();
      timeFormats.minutes = date.minute();
      timeFormats.seconds = date.second();
    }, 1000);

    return () => clearInterval(interval);
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
</script>

<div
  class="AnalogClock blur-thin"
  data-size={config.size}
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
  "
>
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

<style lang="scss">
  .AnalogClock {
    padding: 13px;
    border-radius: 20px;
    border: 1px solid var(--separator-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    &[data-size="compact"] {
      padding: 7px;
    }

    // SVG Container
    & > svg {
      @include box();
      aspect-ratio: 1;
      max-width: 100%;
      max-height: 100%;

      & > circle {
        fill: #fff; // TODO: Theme
      }
    }

    // Clock Face
    &__face {
      fill: white; // TODO: Theme
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
      stroke: #999; // TODO: Theme
      stroke-width: 0.5;
    }

    // Hour Numbers
    text {
      font-weight: 600;
      font-size: clamp(4px, 1.2vw, 8px); // TODO: Theme
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

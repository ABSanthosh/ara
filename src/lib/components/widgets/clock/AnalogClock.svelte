<script lang="ts">
  import { onMount } from "svelte";
  import { draggable } from "../../../actions/draggable.svelte";
  import { resizable } from "../../../actions/resizable.svelte";
  import {
    getTimeForCity,
    getTimezoneOffset,
    getCityAbbreviation,
    type SupportedCityName,
  } from "../../../utils/timezone";
  import settingStore from "../../../../lib/stores/settingStore";
  import type { AnalogClockSpan } from "../../../stores/settingStore";

  let time = $state(new Date());

  interface Props {
    id: string;
    pos: {
      row: number;
      col: number;
    };
    span: AnalogClockSpan;
    settings: {
      showNumbers: boolean;
      city?: SupportedCityName;
      showSecondsHand: boolean;
    };
    isEditable?: boolean;
    onDragEnd: (newRow: number, newCol: number) => void;
    onResize: (newSpan: AnalogClockSpan) => void;
    onRemove?: () => void;
  }

  // settings
  // Show numbers
  // Show seconds hand

  let { id, pos, span, onResize, settings, onDragEnd, isEditable = false, onRemove }: Props = $props();

  // Current position and size state
  let currentGridRow = $state(pos.row);
  let currentGridCol = $state(pos.col);
  let currentSpanX = $state(span.x);
  let currentSpanY = $state(span.y);

  // Draggable options
  const draggableOptions = {
    onDragEnd: handleDragEnd,
  };

  // Resizable options
  const resizableOptions = {
    allowedSizes: ["1x1", "2x2"],
    onResize: handleResize,
  };

  let hours = $derived(time.getHours());
  let minutes = $derived(time.getMinutes());
  let seconds = $derived(time.getSeconds());

  // Get timezone offset and create city abbreviation
  let timezoneOffset = $derived(
    settings.city ? getTimezoneOffset(settings.city) : 0
  );
  let cityAbbr = $derived(getCityAbbreviation(settings.city));
  let offsetDisplay = $derived(
    timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`
  );

  // Widget size helpers
  let isSmallWidget = $derived(currentSpanX === 1 && currentSpanY === 1);
  let widgetSize = $derived(isSmallWidget ? "small" : "large");

  // Handle drag end to update position
  function handleDragEnd(newRow: number, newCol: number) {
    currentGridRow = newRow;
    currentGridCol = newCol;
    onDragEnd(newRow, newCol);
  }

  // Handle resize to update size
  function handleResize(newSpanX: number, newSpanY: number) {
    // Type assertion to ensure only valid combinations are allowed
    const newSpan = { x: newSpanX, y: newSpanY } as AnalogClockSpan;
    currentSpanX = newSpan.x;
    currentSpanY = newSpan.y;
    onResize(newSpan);
  }

  onMount(() => {
    const updateTime = () => {
      time = getTimeForCity(settings.city);
    };

    // Initial update
    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div
  {id}
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  class="AnalogClock BlurBG"
  class:draggable-widget={$settingStore.options.isDraggable}
  style="grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow +
    currentSpanY} / {currentGridCol + currentSpanX};"
  data-size={widgetSize}
>
  <svg viewBox="-50 -50 100 100">
    <circle class="AnalogClock__face" r="48" />
    {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
      <line
        y2="45"
        class="AnalogClock__major"
        transform="rotate({30 * minute})"
        y1={isSmallWidget ? "39" : "42"}
      />
      {#if !isSmallWidget}
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
          y1="42"
          y2="45"
          class="AnalogClock__minor"
          transform="rotate({6 * (minute + offset)})"
        />
      {/each}
    {/each}

    <!-- City name and timezone offset in center -->
    {#if settings.city}
      <text x="0" y="-12" text-anchor="middle" class="AnalogClock__city-text">
        {cityAbbr}
      </text>
      <text x="0" y="20" text-anchor="middle" class="AnalogClock__offset-text">
        {offsetDisplay}
      </text>
    {/if}

    <!-- hour hand -->
    <g class="AnalogClock__hour" transform="rotate({30 * hours + minutes / 2})">
      <line class="AnalogClock__hour--base" y1="0" y2="-8" />
      <line class="AnalogClock__hour--line" y1="-7" y2="-26" />
      <circle r="2" />
    </g>

    <!-- minute hand -->
    <g
      class="AnalogClock__minute"
      transform="rotate({6 * minutes + seconds / 10})"
    >
      <line class="AnalogClock__minute--base" y1="0" y2="-12" />
      <line class="AnalogClock__minute--line" y1="-7" y2="-40" />
    </g>

    <!-- second hand -->
    <g class="AnalogClock__second" transform="rotate({6 * seconds})">
      <line class="AnalogClock__second--line" y1="6" y2="-44" />
      <circle r="1" />
    </g>
    <circle r="0.7" />
  </svg>

  {#if isEditable && onRemove}
    <button class="remove-button" onclick={onRemove} title="Remove widget">
      ×
    </button>
  {/if}
</div>

<style lang="scss">
  @use "../../../../styles/mixins.scss" as *;

  .AnalogClock {
    // Ensure component fits within grid system
    padding: 8px;
    @include box();
    max-width: 100%;
    max-height: 100%;
    min-width: 120px;
    min-height: 120px;
    @include make-flex();
    box-sizing: border-box;

    // Ensure proper positioning within grid
    overflow: hidden;
    position: relative;

    // Responsive padding based on size
    @include respondAt(768px) {
      padding: 6px;
    }
    @include respondAt(480px) {
      padding: 4px;
    }

    & > svg {
      @include box();
      aspect-ratio: 1;
      max-width: 100%;
      max-height: 100%;

      & > circle {
        // TODO: Theme
        fill: #fff;
      }
    }

    &__face {
      // TODO: Theme
      fill: white;
    }

    &__major,
    &__minor {
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &[data-size="small"] {
      .AnalogClock__major {
        stroke-width: 1.5;
      }
      .AnalogClock__minor {
        stroke-width: 0.8;
      }
      .AnalogClock__city-text {
        font-size: 12px;
      }
      .AnalogClock__offset-text {
        font-size: 12px;
      }
    }

    &[data-size="large"] {
      .AnalogClock__city-text {
        font-size: 10px;
      }
      .AnalogClock__offset-text {
        font-size: 8px;
      }
    }

    &__major {
      stroke: #333;
      stroke-width: 1;
    }

    text {
      // TODO: Theme
      font-weight: 600;
      font-size: clamp(4px, 1.2vw, 8px);
    }

    &__city-text {
      fill: #8e8e93;
      font-weight: 600;
      letter-spacing: 0.5px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    }

    &__offset-text {
      fill: #8e8e93;
      font-weight: 500;
      letter-spacing: 0.2px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    }

    &__minor {
      // TODO: Theme
      stroke: #999;
      stroke-width: 0.5;
    }

    &__hour {
      --color: #1f1f1f;
      & > circle {
        stroke: var(--color);
      }
      &--base {
        stroke-width: 1.5;
        stroke: var(--color);
      }
      &--line {
        stroke-width: 3.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke: #111111;
        filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
      }
    }

    &__minute {
      --color: #1f1f1f;
      &--base {
        stroke-width: 1.5;
        stroke: var(--color);
      }
      &--line {
        stroke-width: 3.5;
        stroke: #111111;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
      }
    }

    &__second {
      &--line {
        stroke-width: 1;
        stroke: #ff0000;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.2));
      }

      & > circle {
        stroke: #ff0000;
        fill: #ff0000;
      }
    }

    // Responsive adjustments for smaller screens
    @include respondAt(768px) {
      &__hour--line,
      &__minute--line {
        stroke-width: 3;
      }

      &__major {
        stroke-width: 0.8;
      }

      &__minor {
        stroke-width: 0.4;
      }

      &[data-size="large"] {
        .AnalogClock__city-text {
          font-size: 7px;
        }
        .AnalogClock__offset-text {
          font-size: 5px;
        }
      }

      &[data-size="small"] {
        .AnalogClock__city-text {
          font-size: 5px;
        }
        .AnalogClock__offset-text {
          font-size: 3.5px;
        }
      }
    }

    @include respondAt(480px) {
      &__hour--line,
      &__minute--line {
        stroke-width: 2.5;
      }

      &__major {
        stroke-width: 0.6;
      }

      &__minor {
        stroke-width: 0.3;
      }

      &__second--line {
        stroke-width: 0.8;
      }

      &[data-size="large"] {
        .AnalogClock__city-text {
          font-size: 6px;
        }
        .AnalogClock__offset-text {
          font-size: 4.5px;
        }
      }

      &[data-size="small"] {
        .AnalogClock__city-text {
          font-size: 4px;
        }
        .AnalogClock__offset-text {
          font-size: 3px;
        }
      }
    }
  }

  .remove-button {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 59, 48, 0.9);
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
      background: rgba(255, 59, 48, 1);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
</style>

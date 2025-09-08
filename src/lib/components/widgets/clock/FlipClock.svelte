<svelte:options runes={true} />

<script lang="ts">
  // Ref: https://github.com/ronanru/svelte-flip-clock/blob/main/src/lib/FlipClock.svelte
  // Insp: https://gridfiti.com/wp-content/uploads/2021/08/Gridfiti_Blog_BestiPadWidgets_Clock.jpg
  import { onMount, onDestroy } from "svelte";
  import {
    draggable,
    type DraggableOptions,
  } from "../../../actions/draggable.svelte";
  import {
    resizable,
    type ResizableOptions,
  } from "../../../actions/resizable.svelte";
  import {
    getTimeForCity,
    getTimezoneOffset,
    getCityAbbreviation,
    SUPPORTED_CITIES,
    type SupportedCityName,
  } from "../../../utils/timezone";
  import type { FlipClockSpan } from "../../../stores/settingStore";
  import settingStore from "../../../../lib/stores/settingStore";

  interface Props {
    id: string;
    pos: {
      row: number;
      col: number;
    };
    span: FlipClockSpan;
    settings: {
      showSeconds: boolean;
      city?: SupportedCityName;
    };
    onResize: (newSpan: FlipClockSpan) => void;
    onDragEnd: (newRow: number, newCol: number) => void;
  }

  let { id, pos, span, settings, onResize, onDragEnd }: Props = $props();

  let time = $state(new Date());
  let clockContainer: HTMLDivElement;
  let containerWidth = $state(240);
  let interval: NodeJS.Timeout;

  // Current position and size state
  let currentGridRow = $state(pos.row);
  let currentGridCol = $state(pos.col);
  let currentSpanX = $state(span.x);
  let currentSpanY = $state(span.y);

  // Get timezone offset and create city abbreviation
  let timezoneOffset = $derived(getTimezoneOffset(settings.city));
  let cityAbbr = $derived(getCityAbbreviation(settings.city));
  let offsetDisplay = $derived(
    timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`
  );

  // Handle drag end to update position
  function handleDragEnd(newRow: number, newCol: number) {
    currentGridRow = newRow;
    currentGridCol = newCol;
    onDragEnd(newRow, newCol);
  }

  // Handle resize to update size
  function handleResize(newSpanX: number, newSpanY: number) {
    // Type assertion to ensure only valid combinations are allowed
    const newSpan = { x: newSpanX, y: newSpanY } as FlipClockSpan;
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
    allowedSizes: ["2x1", "2x2"],
    onResize: handleResize,
  };

  // I18n date formatting options
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Reactive date calculation with i18n support
  const fullDate = $derived(() => {
    const timezone = settings.city
      ? SUPPORTED_CITIES.find((c) => c.name === settings.city)?.timezone
      : undefined;

    return new Intl.DateTimeFormat("en-US", {
      ...dateFormatOptions,
      timeZone: timezone,
    }).format(time);
  });

  let display = $state([
    {
      top: "00",
      bottom: "00",
      transition: false,
    },
    {
      top: "00",
      bottom: "00",
      transition: false,
    },
    {
      top: "00",
      bottom: "00",
      transition: false,
    },
  ]);

  // Get display segments based on settings
  const getTimeSegments = (time: Date) => {
    const segments = [
      (time.getHours() % 12 || 12).toString().padStart(2, "0"),
      time.getMinutes().toString().padStart(2, "0"),
    ];

    if (settings.showSeconds) {
      segments.push(time.getSeconds().toString().padStart(2, "0"));
    }

    return segments;
  };

  // Update container width for responsive font sizing
  function updateContainerSize() {
    if (clockContainer) {
      containerWidth = clockContainer.offsetWidth;
    }
  }

  onMount(() => {
    // Initialize time and display
    const updateTime = () => {
      time = getTimeForCity(settings.city);
    };

    // Initial update
    updateTime();

    const initialSegments = getTimeSegments(time);
    display = initialSegments.map((value) => ({
      top: value,
      bottom: value,
      transition: false,
    }));

    // Update container size
    updateContainerSize();

    // Set up resize observer for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    if (clockContainer) {
      resizeObserver.observe(clockContainer);
    }

    // Start the clock interval
    interval = setInterval(() => {
      updateTime();
      const newSegments = getTimeSegments(time);

      // Pad the display array if showing seconds
      while (display.length < newSegments.length) {
        display = [...display, { top: "00", bottom: "00", transition: false }];
      }

      // Trigger flip animation for changed segments
      display = display.slice(0, newSegments.length).map(({ bottom }, i) => ({
        top: newSegments[i],
        bottom,
        transition: newSegments[i] !== bottom,
      }));

      // Complete the flip after animation
      setTimeout(() => {
        display = display.map((_, i) => ({
          bottom: newSegments[i],
          top: newSegments[i],
          transition: false,
        }));
      }, 500);
    }, 1000);

    return () => {
      clearInterval(interval);
      resizeObserver.disconnect();
    };
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>

<div
  {id}
  bind:this={clockContainer}
  class="FlipClock BlurBG"
  class:draggable-widget={$settingStore.options.isDraggable}
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  style="
		grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow +
    currentSpanY} / {currentGridCol + currentSpanX};
		--container-width: {containerWidth}px;
		--base-size: {containerWidth * 0.06}px;
		--segment-size: {containerWidth * 0.16}px;
		--date-size: {containerWidth * 0.07}px;
	"
>
  <div class="FlipClock__box">
    <div class="FlipClock__overlay">
      {#each display as segment, index}
        <div class="FlipClock__segment">
          <p
            class="FlipClock__segment--top"
            class:transition={segment.transition}
          >
            <span>
              {segment.bottom}
            </span>
          </p>
          <p
            class="FlipClock__segment--bottom"
            class:transition={segment.transition}
          >
            <span>
              {segment.top}
            </span>
          </p>
        </div>
        {#if index < display.length - 1}
          <div class="FlipClock__colon">:</div>
        {/if}
      {/each}
    </div>
    <div class="FlipClock__base">
      {#each display as segment, index}
        <div class="FlipClock__segment">
          <p class="FlipClock__segment--top">
            {segment.top}
          </p>
          <p class="FlipClock__segment--bottom">
            {segment.bottom}
          </p>
        </div>
        {#if index < display.length - 1}
          <div class="FlipClock__colon">:</div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- City and timezone information -->
  {#if settings.city}
    <div class="FlipClock__timezone-info">
      <span class="FlipClock__city">{cityAbbr}</span>
      <span class="FlipClock__offset">{offsetDisplay}</span>
    </div>
  {/if}

  <p class="FlipClock__date">
    {fullDate()}
  </p>
</div>

<style lang="scss">
  .FlipClock {
    width: 100%;
    height: 100%;
    gap: calc(var(--base-size) * 0.5);
    // display: flex;
    // flex-direction: column;
    // align-items: center;
    // justify-content: center;
    padding: calc(var(--base-size) * 0.8);

    display: grid;
    grid-template-rows: 1fr 0.1fr 0.1fr;

    & > * {
      user-select: none;
    }

    &__date {
      font-size: var(--date-size);
      font-family: "JetBrains Mono", monospace;
      color: white;
      margin: 0;
      text-align: center;
      white-space: nowrap;
    }

    &__timezone-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--base-size) * 0.5);
      font-family: "JetBrains Mono", monospace;
      font-size: calc(var(--date-size) * 0.8);
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    &__city {
      font-weight: 600;
    }

    &__offset {
      opacity: 0.7;
      font-size: 0.9em;
    }

    &__box {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      grid-template-rows: 1fr;
      gap: calc(var(--base-size) * 0.4);
      align-items: center;
    }

    &__overlay {
      grid-area: 1 / 1 / 2 / 6;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      gap: calc(var(--base-size) * 0.4);
      align-items: center;
      z-index: 10;

      .FlipClock__segment {
        &--bottom {
          transform: scaleY(0);
        }
      }
    }

    &__base {
      grid-area: 1 / 1 / 2 / 6;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      gap: calc(var(--base-size) * 0.4);
      align-items: center;
    }

    &__colon {
      font-size: var(--segment-size);
      font-family: "JetBrains Mono", monospace;
      font-weight: 500;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding-bottom: 5px;
      line-height: 100%;
      animation: blink 1s infinite;
    }

    &__segment {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      color: white;
      position: relative;

      --__separator: 0px;

      p,
      span {
        background-color: transparent;
        border-radius: calc(var(--base-size) * 0.3);
        font-size: var(--segment-size);
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        transition: background-color 0.1s ease;
        line-height: 100%;
      }

      &--top,
      &--bottom {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        // height: 100%;
        margin: 0;
      }

      &--top {
        position: absolute;
        top: 0;
        left: 0;
        clip-path: inset(0px 0px calc(50% + var(--__separator)) 0px);

        &.transition {
          transition: transform 0.25s ease-in;
          transform: scaleY(0);

          p,
          span {
            background-color: rgba(18, 18, 18, 0.9);
            backdrop-filter: blur(10px);
          }
        }
      }

      &--bottom {
        clip-path: inset(calc(50% + var(--__separator)) 0px 0px 0px);
        top: 0;
        left: 0;
        position: absolute;

        &.transition {
          transition: transform 0.25s 0.25s ease-out;
          transform: scale(100%);

          p,
          span {
            background-color: rgba(18, 18, 18, 0.9);
            backdrop-filter: blur(10px);
          }
        }
      }
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
  }
</style>

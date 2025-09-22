<script lang="ts">
  import { onMount } from "svelte";
  import { draggable } from "../../actions/draggable.svelte";
  import { resizable } from "../../actions/resizable.svelte";
  import { dissolve } from "../../actions/dissolve.svelte";
  import { ChevronLeft, ChevronRight, Minus, PenLine, RotateCcw } from "@lucide/svelte";
  import { getTimeForCity, type SupportedCityName } from "../../utils/timezone";
  import type { CalendarSpan } from "../../stores/settingStore";
  import settingStore from "../../../lib/stores/settingStore";

  interface Props {
    id: string;
    pos: {
      row: number;
      col: number;
    };
    span: CalendarSpan;
    settings: {
      city?: SupportedCityName;
    };
    isEditable?: boolean;
    onDragEnd: (newRow: number, newCol: number) => void;
    onResize: (newSpan: CalendarSpan) => void;
    onRemove?: () => void;
    openSettings?: (widgetId: string) => void;
  }

  let {
    id,
    pos = { row: 1, col: 1 },
    span = { x: 2, y: 2 },
    settings,
    isEditable = false,
    onDragEnd = (_newRow: number, _newCol: number) => {},
    onResize = (_newSpan: CalendarSpan) => {},
    onRemove,
    openSettings
  }: Props = $props();

  // Current position and size state
  let currentGridRow = $state(pos.row);
  let currentGridCol = $state(pos.col);
  let currentSpanX = $state(span.x);
  let currentSpanY = $state(span.y);

  // Calendar data - using timezone-aware date
  let currentDate = $state(getTimeForCity(settings.city));
  let currentMonth = $state(currentDate.getMonth());
  let currentYear = $state(currentDate.getFullYear());
  let today = $state(currentDate.getDate());
  
  // Widget element reference for dissolve animation
  let widgetElement: HTMLElement;

  // Update calendar when timezone changes
  $effect(() => {
    currentDate = getTimeForCity(settings.city);
    // Only update today if we're viewing the current month
    const now = getTimeForCity(settings.city);
    if (currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
      today = now.getDate();
    }
  });

  // Draggable options
  let draggableOptions = $derived({
    onDragEnd: handleDragEnd,
  });

  // Resizable options
  let resizableOptions = $derived({
    allowedSizes: ["1x1", "2x2"],
    onResize: handleResize,
    onResizeStart: () => {
      isResizing = true;
    },
    onResizeEnd: () => {
      // Clear any existing timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      // Reset isResizing after a short delay
      resizeTimeout = setTimeout(() => {
        isResizing = false;
      }, 100);
    },
  });

  // Handle drag end to update position
  function handleDragEnd(newRow: number, newCol: number) {
    currentGridRow = newRow;
    currentGridCol = newCol;
    onDragEnd(newRow, newCol);
  }

  // Handle resize to update size
  function handleResize(newSpanX: number, newSpanY: number) {
    const newSpan = { x: newSpanX, y: newSpanY } as CalendarSpan;
    currentSpanX = newSpan.x;
    currentSpanY = newSpan.y;
    onResize(newSpan);
  }

  // Function to trigger dissolve effect
  async function triggerDissolve() {
    if (widgetElement) {
      await dissolve(widgetElement, {
        duration: 300,
        maintainPosition: true,
        onComplete: () => {
          onRemove?.();
        }
      });
    }
  }
  // Track if we're currently resizing to hide content
  let isResizing = $state(false);
  let resizeTimeout: ReturnType<typeof setTimeout>;

  // Calendar utility functions
  const resetMonth = () => {
    const now = getTimeForCity(settings.city);
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    today = now.getDate();
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear += 1;
    } else {
      currentMonth += 1;
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else {
      currentMonth -= 1;
    }
  };

  // Internationalized calendar data based on timezone
  let localeData = $derived(() => {
    const date = getTimeForCity(settings.city);
    const locale = getLocaleForCity(settings.city);

    return {
      monthNames: Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "long" }).format(
          new Date(2024, i, 1)
        )
      ),
      shortMonthNames: Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "short" }).format(
          new Date(2024, i, 1)
        )
      ),
      dayNames: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, 7 + i); // Start from a Sunday
        return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
          date
        );
      }),
      shortDayNames: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, 7 + i);
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          date
        );
      }),
      dayAbbreviations: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(2024, 0, 7 + i);
        return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
          date
        );
      }),
    };
  });

  // Helper function to get appropriate locale for a city
  function getLocaleForCity(city?: SupportedCityName): string {
    const localeMap: Record<string, string> = {
      "New York": "en-US",
      "Los Angeles": "en-US",
      Chicago: "en-US",
      London: "en-GB",
      Paris: "fr-FR",
      Berlin: "de-DE",
      Tokyo: "ja-JP",
      Sydney: "en-AU",
      Dubai: "ar-AE",
      Singapore: "en-SG",
      "Hong Kong": "zh-HK",
      Mumbai: "en-IN",
    };

    return city ? localeMap[city] || "en-US" : "en-US";
  }

  // Widget size helpers
  let isSmallWidget = $derived(currentSpanX === 1 && currentSpanY === 1);
  let shouldShowCompact = $derived(isResizing || isSmallWidget);

  // Get current day of week for 1x1 mode
  let currentDayOfWeek = $derived(() => {
    const date = new Date(currentYear, currentMonth, today);
    return date.getDay();
  });

  // Get the actual current date for compact display
  let actualToday = $derived(() => {
    const now = getTimeForCity(settings.city);
    return now.getDate();
  });

  // Update time periodically
  onMount(() => {
    const updateTime = () => {
      const now = getTimeForCity(settings.city);
      if (
        currentMonth === now.getMonth() &&
        currentYear === now.getFullYear()
      ) {
        today = now.getDate();
      }
    };

    // Update every minute to keep the calendar current
    const interval = setInterval(updateTime, 60000);

    return () => {
      clearInterval(interval);
    };
  });

  // Get the actual day of week for compact display
  let actualDayOfWeek = $derived(() => {
    const now = getTimeForCity(settings.city);
    return now.getDay();
  });

  function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(month: number, year: number): number {
    return new Date(year, month, 1).getDay();
  }

  function generateCalendarDays() {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }

  $effect(() => {
    // Update today when the component mounts or date changes
    const now = getTimeForCity(settings.city);
    if (now.getMonth() === currentMonth && now.getFullYear() === currentYear) {
      today = now.getDate();
    } else {
      today = -1; // No current day highlight for other months
    }
  });

  let calendarDays = $derived(generateCalendarDays());
  let rowCount = $derived(Math.ceil(calendarDays.length / 7));
</script>

<div
  bind:this={widgetElement}
  {id}
  class="calendar-widget"
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  class:compact={shouldShowCompact}
  class:draggable-widget={$settingStore.options.isDraggable}
  style="grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow +
    currentSpanY} / {currentGridCol + currentSpanX}; --rowCount: {rowCount};"
>
  <div class="calendar-container">
    {#if shouldShowCompact}
      <!-- Compact 1x1 layout -->
      <div class="compact-calendar">
        <div class="compact-header">
          <div class="compact-month">
            {localeData().shortMonthNames[new Date().getMonth()]}
          </div>
          <div class="compact-day-name">
            {localeData().shortDayNames[actualDayOfWeek()]}
          </div>
        </div>
        <div class="compact-date">{actualToday()}</div>
      </div>
    {:else}
      <!-- Full 2x2 layout -->
      <!-- Month Header -->
      <div class="month-header">
        <h2 class="month-name">
          {localeData().shortMonthNames[currentMonth]}. {currentYear}
        </h2>
        <div class="month-controls">
          <button class="prev-month" onclick={prevMonth}>
            <ChevronLeft size="16" />
          </button>
          <button class="reset-month" onclick={resetMonth}>
            <RotateCcw size="16" />
          </button>
          <button class="next-month" onclick={nextMonth}>
            <ChevronRight size="16" />
          </button>
        </div>
      </div>

      <!-- Day Headers -->
      <div class="day-headers">
        {#each localeData().dayAbbreviations as day}
          <div class="day-header">{day}</div>
        {/each}
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        {#each calendarDays as day}
          <div
            class="calendar-day"
            class:today={day === today}
            class:empty={day === null}
          >
            {day || ""}
          </div>
        {/each}
      </div>
    {/if}
  </div>

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
  .calendar-widget {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    position: relative;

    // Ensure the widget fills the grid cell properly
    width: 100%;
    height: 100%;
    // min-height: 240px; // Minimum height for 2x2 calendar

    // Force proper sizing during resize transitions
    // &.compact {
    //   min-height: 120px; // Smaller minimum height for 1x1
    // }

    & > * {
      user-select: none;
    }
  }

  .calendar-container {
    padding: 10px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden; // Prevent overflow
  }

  .month-header {
    text-align: center;
    // margin-bottom: 2px;
    flex-shrink: 0; // Don't let this shrink
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .month-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .prev-month,
    .next-month,
    .reset-month {
      background: transparent;
      border: none;
      color: #374151;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s ease;

      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }
    }
  }

  .month-name {
    font-size: 16px;
    font-weight: 600;
    color: #ef4444;
    letter-spacing: 1px;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    // margin-bottom: 2px;
    flex-shrink: 0; // Don't let this shrink
  }

  .day-header {
    text-align: center;
    font-size: 9px;
    font-weight: 500;
    color: #6b7280;
    padding: 1px 0;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(var(--rowCount), 1fr);
    gap: 1px;
    flex: 1;
    min-height: 0; // Allow the grid to shrink
  }

  .calendar-day {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    border-radius: 4px;
    transition:
      background-color 0.2s ease,
      transform 0.1s ease;
    position: relative;
    min-height: 0; // Allow shrinking
    height: 100%; // Fill the grid cell
    width: 100%; // Fill the grid cell

    &:not(.empty):not(.today):hover {
      background-color: rgba(59, 130, 246, 0.1);
      transform: scale(1.05);
    }

    &.today {
      background-color: #ef4444;
      color: white;
      font-weight: 600;
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    &.empty {
      visibility: hidden;
    }
  }

  // Compact 1x1 layout styles
  .calendar-widget.compact {
    // Use same background as 2x2 layout
    background: rgba(255, 255, 255, 0.95);

    .calendar-container {
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .compact-calendar {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    height: 100%;
  }

  .compact-header {
    gap: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .compact-month {
    font-size: 20px;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  .compact-day-name {
    font-size: 20px;
    font-weight: 800;
    color: #6b7280;
    letter-spacing: 0.5px;
  }

  .compact-date {
    font-size: 55px;
    font-weight: 700;
    color: #374151;
    line-height: 1;
  }

  // Responsive adjustments based on widget size
  .calendar-widget {
    // For 2x2 grid (default) - smaller, tighter spacing
    .calendar-day,
    .day-header {
      font-size: 14px;
    }

    .month-name {
      font-size: 16px;
      font-weight: 600;
    }
  }

  // Larger sizes get bigger text and more spacing
  :global(.calendar-widget[style*="/ 4"]) {
    // 3x3 width
    .calendar-container {
      padding: 16px;
      gap: 8px;
    }

    .month-name {
      font-size: 16px;
    }

    .day-header {
      font-size: 11px;
    }

    .calendar-day {
      font-size: 12px;
      border-radius: 6px;
    }

    .calendar-grid,
    .day-headers {
      gap: 2px;
    }
  }

  :global(.calendar-widget[style*="/ 5"]) {
    // 4x4+ width
    .calendar-container {
      padding: 16px;
      gap: 5px;
    }

    .month-name {
      font-size: 18px;
    }

    .day-header {
      font-size: 13px;
    }

    .calendar-day {
      font-size: 14px;
      border-radius: 8px;
    }

    .calendar-grid,
    .day-headers {
      gap: 3px;
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

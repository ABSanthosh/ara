<script lang="ts">
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import type { CalendarWidget } from "@/lib/modules/widgets/widgets.types";
  import dayjs from "dayjs";
  import { ChevronLeft, ChevronRight, RotateCcw } from "@lucide/svelte";

  let {
    widget,
  }: {
    widget: CalendarWidget;
  } = $props();

  // svelte-ignore state_referenced_locally
  const size = widget.span.x === 1 && widget.span.y === 1 ? "compact" : "large";

  const today = dayjs();
  let date = $state(dayjs());
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
  console.log(dateFormats);
</script>

<div
  data-size={size}
  use:draggable={widget.id!}
  class="calendar blur-regular"
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
  "
>
  {#if size === "large"}
    <!-- Month Header -->
    <div class="month-header">
      <h2 class="month-name">
        {dateFormats.month.short}. {dateFormats.year.numeric}
      </h2>
      <div class="month-controls">
        <button
          class="prev-month"
          onclick={() => (date = date.subtract(1, "month"))}
        >
          <ChevronLeft size="15" />
        </button>
        <button class="reset-month" onclick={() => (date = dayjs())}>
          <RotateCcw size="14" />
        </button>
        <button
          class="next-month"
          onclick={() => (date = date.add(1, "month"))}
        >
          <ChevronRight size="15" />
        </button>
      </div>
    </div>

    <!-- Day Header -->
    <div class="day-header">
      {#each dateFormats.weekday.allDays as day}
        <div class="day-name">{day[0]}</div>
      {/each}
    </div>

    <!-- Date Grid -->
    <div
      class="date-grid"
      style="--rowCount: {dateFormats.month.calendarDays.length / 7}"
    >
      {#each dateFormats.month.calendarDays as day}
        <div
          class="date-cell"
          class:empty={day === null}
          class:today={day === today.format("DD") &&
            date.format("MMYYYY") === today.format("MMYYYY")}
        >
          {day || ""}
        </div>
      {/each}
    </div>
  {:else}{/if}
</div>

<style lang="scss">
  .calendar {
    padding: 13px;
    border-radius: 20px;
    background-color: #fff;
    border: 1px solid var(--separator);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    // Hover effect for day headers based on date cell hover
    @for $i from 1 through 7 {
      &:has(.date-grid .date-cell:nth-child(7n + #{$i}):hover) {
        .day-header .day-name:nth-child(#{$i}) {
          color: var(--colors-pink);
          font-weight: 600;
          transform: scale(1.1);
        }
      }
    }

    &[data-size="large"] {
      @include make-flex(
        $gap: 5px,
        $dir: column,
        $just: flex-start,
        $align: flex-start
      );
    }

    & * {
      user-select: none;
    }

    .month-header {
      width: 100%;
      flex-shrink: 0; // Don't let this shrink
      @include make-flex($dir: row, $just: space-between, $gap: 8px);

      .month-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        overflow: hidden;
        letter-spacing: 1px;
        text-overflow: ellipsis;
        color: var(--colors-pink);
      }

      .month-controls {
        @include make-flex($dir: row, $gap: 4px);
      }

      .prev-month,
      .next-month,
      .reset-month {
        border: none;
        padding: 4px;
        cursor: pointer;
        font-size: 16px;
        border-radius: 4px;
        @include make-flex();
        background: transparent;
        transition: background-color 0.2s ease;

        border-radius: 20px;
        @supports (corner-shape: squircle) {
          border-radius: 20px;
          corner-shape: squircle;
        }

        & > svg {
          color: var(--colors-pink) !important;
        }

        &:hover {
          background-color: var(--views-recessed-material-view);
        }
        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      }
    }

    .day-header {
      gap: 1px;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex-shrink: 0; // Don't let this shrink

      .day-name {
        font-size: 13px;
        padding: 1px 0;
        font-weight: 500;
        text-align: center;
        color: var(--vibrant-labels-secondary);
      }
    }

    .date-grid {
      flex: 1;
      gap: 1px;
      width: 100%;
      display: grid;
      min-height: 0; // Allow the grid to shrink
      align-items: center;
      justify-items: center;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: repeat(var(--rowCount), 1fr);

      .date-cell {
        @include box();
        font-size: 14px;
        max-width: 27px;
        min-height: 0; // Allow the cell to shrink
        max-height: 27px;
        border-radius: 4px;
        @include make-flex();
        color: var(--vibrant-labels-tertiary);
        transition:
          background-color 0.2s ease,
          transform 0.1s ease;

        border-radius: 20px;
        @supports (corner-shape: squircle) {
          border-radius: 20px;
          corner-shape: squircle;
        }

        &:not(.empty):not(.today):hover {
          transform: scale(1.05);
          background-color: rgba(59, 130, 246, 0.1);
        }

        &.today {
          font-weight: 600;
          color: var(--vibrant-labels-primary);
          background-color: var(--colors-pink);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        &.empty {
          visibility: hidden;
        }
      }
    }
  }
</style>

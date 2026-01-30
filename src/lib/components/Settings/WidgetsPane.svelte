<script lang="ts">
  import Grid from "../Grid.svelte";
  import Cat from "@/lib/components/widgets/Cat.svelte";
  import Calendar from "@/lib/components/widgets/Calendar.svelte";
  import Checklist from "@/lib/components/widgets/Checklist.svelte";
  import type { Widgets } from "@/lib/modules/widgets/widgets.types";
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import { SettingStore } from "@/lib/modules/settings/settings.store";
  import TestWidget from "@/lib/components/widgets/TestWidget.svelte";
  import ClockFlip from "@/lib/components/widgets/Clock/ClockFlip.svelte";
  import ClockSemiDigital from "@/lib/components/widgets/Clock/ClockSemiDigital.svelte";
  import ClockClassicAnalog from "@/lib/components/widgets/Clock/ClockClassicAnalog.svelte";

  // Local state for demo widgets
  let demoWidgets: Record<string, Widgets> = $state({});

  // Local grid state
  let localGrid = $state({
    rows: 0,
    cols: 0,
    cellSize: 0,
    gap: 0,
  });

  // Dynamic minimum rows based on widgets
  let minRequiredRows = $state<null | number>(null);
  let gridParent = $state<HTMLElement | null>(null);
  let activeFilter = $state("All");

  // Callback to receive grid updates
  function handleGridUpdate(gridInfo: {
    grid: HTMLElement;
    rows: number;
    cols: number;
    cellSize: number;
    gap: number;
  }) {
    localGrid = gridInfo;
  }

  /**
   * Handle clicking on a demo widget to add it to the actual grid
   */
  function handleWidgetClick(widget: Widgets) {
    // Create a copy of the widget without demo-specific properties
    // The WidgetEngine.addWidget will assign a new id and pos
    const { id, pos, isDemo, ...widgetData } = widget;

    // Reconstruct the widget with the required properties for addWidget
    // pos is required by the type but will be overwritten by addWidget
    const widgetToAdd = {
      ...widgetData,
      pos: { row: 1, col: 1 }, // Temporary position, will be calculated by addWidget
    } as Widgets;

    WidgetEngine.addWidget(widgetToAdd);
  }

  /**
   * Calculate the minimum number of rows needed to fit all widgets
   * for a given number of columns
   */
  function calculateMinRows(
    widgetList: Omit<Widgets, "id" | "pos">[],
    gridCols: number,
  ): number {
    const occupiedCells = new Set<string>();
    let maxRowUsed = 0;

    // Sort widgets by size (larger first) for better packing
    const sortedWidgets = [...widgetList].sort((a, b) => {
      const areaA = a.span.x * a.span.y;
      const areaB = b.span.x * b.span.y;
      return areaB - areaA;
    });

    // Try to place widgets with an unlimited row count
    for (const widget of sortedWidgets) {
      const spanX = widget.span.x;
      const spanY = widget.span.y;

      // Skip if widget is too wide for the grid
      if (spanX > gridCols) {
        continue;
      }

      // Try to find a place in the grid (start from row 1 and go as far as needed)
      let placed = false;
      let currentRow = 1;

      while (!placed) {
        for (let col = 1; col <= gridCols - spanX + 1 && !placed; col++) {
          let canPlace = true;

          // Check if all cells are available
          for (let r = currentRow; r < currentRow + spanY; r++) {
            for (let c = col; c < col + spanX; c++) {
              if (occupiedCells.has(`${r},${c}`)) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }

          if (canPlace) {
            // Mark cells as occupied
            for (let r = currentRow; r < currentRow + spanY; r++) {
              for (let c = col; c < col + spanX; c++) {
                occupiedCells.add(`${r},${c}`);
              }
            }

            // Update max row used
            maxRowUsed = Math.max(maxRowUsed, currentRow + spanY - 1);
            placed = true;
          }
        }

        if (!placed) {
          currentRow++;
        }
      }
    }

    return maxRowUsed;
  }

  // Hardcoded list of all possible widget combinations for demo
  const ALL_WIDGET_DEMOS: (Omit<Widgets, "id" | "pos"> & { filter: string })[] =
    [
      // Analog Clock variants
      {
        type: "analog-clock",
        filter: "Clock",
        span: { x: 1, y: 1 },
        settings: {
          city: "New York",
          showNumbers: true,
          showSecondsHand: true,
        },
      },
      {
        type: "analog-clock",
        filter: "Clock",
        span: { x: 2, y: 2 },
        settings: {
          city: "London",
          showNumbers: false,
          showSecondsHand: false,
        },
      },

      // Semi-Digital Clock variants
      {
        type: "semi-digital-clock",
        filter: "Clock",
        span: { x: 1, y: 1 },
        settings: { city: "Tokyo", is12Hour: true },
      },
      {
        type: "semi-digital-clock",
        filter: "Clock",
        span: { x: 2, y: 2 },
        settings: { city: "Paris", is12Hour: false },
      },

      // Flip Clock variants
      {
        type: "flip-clock",
        span: { x: 2, y: 1 },
        filter: "Clock",
        settings: { showSeconds: true, city: "Sydney" },
      },
      {
        type: "flip-clock",
        span: { x: 1, y: 2 },
        filter: "Clock",
        settings: { showSeconds: false, city: "Berlin" },
      },

      // Calendar variants
      {
        type: "calendar",
        filter: "Calendar",
        span: { x: 1, y: 1 },
        settings: {},
      },
      {
        type: "calendar",
        filter: "Calendar",
        span: { x: 2, y: 2 },
        settings: {},
      },

      // Cat Widget variants
      {
        type: "cat",
        span: { x: 1, y: 1 },
        settings: {
          subreddit: ["catpics"],
          magazineSize: 5,
          maxAccess: 1,
        },
        filter: "Cat",
      },
      {
        type: "cat",
        span: { x: 2, y: 2 },
        settings: {
          subreddit: ["CatsInHats", "catpictures"],
          magazineSize: 10,
          maxAccess: 2,
        },
        filter: "Cat",
      },

      // Checklist
      {
        type: "checklist",
        span: { x: 2, y: 2 },
        settings: {
          items: [
            { id: "1", text: "Sample task 1", completed: false },
            { id: "2", text: "Sample task 2", completed: true },
          ],
        },
        filter: "Checklist",
      },
    ];

  // Cache filter list to avoid recalculating on every render (must be after ALL_WIDGET_DEMOS)
  const WIDGET_FILTERS = [
    "All",
    ...Array.from(new Set(ALL_WIDGET_DEMOS.map((w) => w.filter))),
  ];
  const FILTER_COUNT = WIDGET_FILTERS.length;

  /**
   * Simplified compact placement algorithm for demo widgets
   * Places widgets in the most compact way possible in the grid
   * with a consistent mixed ordering
   */
  function placeWidgetsCompactly(
    widgetList: Omit<Widgets, "id" | "pos">[],
    gridRows: number,
    gridCols: number,
  ): Widgets[] {
    const placedWidgets: Widgets[] = [];
    const occupiedCells = new Set<string>();

    // Group widgets by size
    const largeWidgets = widgetList.filter((w) => w.span.x * w.span.y >= 4);
    const mediumWidgets = widgetList.filter(
      (w) => w.span.x * w.span.y > 1 && w.span.x * w.span.y < 4,
    );
    const smallWidgets = widgetList.filter((w) => w.span.x * w.span.y === 1);

    // Create a consistent interleaved pattern (no randomness, same order every time)
    const interleavedWidgets: Omit<Widgets, "id" | "pos">[] = [];
    let largeIdx = 0,
      mediumIdx = 0,
      smallIdx = 0;

    // Pattern: large, small, small, medium, small, large, medium, small, ...
    while (
      largeIdx < largeWidgets.length ||
      mediumIdx < mediumWidgets.length ||
      smallIdx < smallWidgets.length
    ) {
      if (largeIdx < largeWidgets.length) {
        interleavedWidgets.push(largeWidgets[largeIdx++]);
      }
      if (smallIdx < smallWidgets.length) {
        interleavedWidgets.push(smallWidgets[smallIdx++]);
      }
      if (smallIdx < smallWidgets.length) {
        interleavedWidgets.push(smallWidgets[smallIdx++]);
      }
      if (mediumIdx < mediumWidgets.length) {
        interleavedWidgets.push(mediumWidgets[mediumIdx++]);
      }
      if (smallIdx < smallWidgets.length) {
        interleavedWidgets.push(smallWidgets[smallIdx++]);
      }
    }

    for (const widget of interleavedWidgets) {
      const spanX = widget.span.x;
      const spanY = widget.span.y;

      // Skip if widget is too large for the grid
      if (spanX > gridCols || spanY > gridRows) {
        continue;
      }

      // Try to find a place in the grid (scan row by row, col by col)
      let placed = false;
      for (let row = 1; row <= gridRows - spanY + 1 && !placed; row++) {
        for (let col = 1; col <= gridCols - spanX + 1 && !placed; col++) {
          let canPlace = true;

          // Check if all cells are available
          for (let r = row; r < row + spanY; r++) {
            for (let c = col; c < col + spanX; c++) {
              if (occupiedCells.has(`${r},${c}`)) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }

          if (canPlace) {
            // Mark cells as occupied
            for (let r = row; r < row + spanY; r++) {
              for (let c = col; c < col + spanX; c++) {
                occupiedCells.add(`${r},${c}`);
              }
            }

            // Create the placed widget
            const placedWidget: Widgets = {
              ...widget,
              id: `demo-${placedWidgets.length}`,
              pos: { row, col },
            } as Widgets;

            placedWidgets.push(placedWidget);
            placed = true;
          }
        }
      }
    }

    return placedWidgets;
  }

  // Calculate minimum rows needed when cols is known
  onMount(() => {
    const cols = Math.floor(
      (gridParent?.clientWidth ?? 0) / (115 + 10), // maxCellSize + gap
    );
    if (cols > 0) {
      // Check cache first for initial minRows calculation
      const filterCache =
        $SettingStore.internal.settings.widgetPane.filterCache;
      const cached = filterCache["All"];
      if (cached) {
        minRequiredRows = cached.minRows;
      } else {
        const calculatedMinRows = calculateMinRows(ALL_WIDGET_DEMOS, cols);
        minRequiredRows = calculatedMinRows;
      }
    }
  });

  function processWidgetPlacement() {
    const { rows, cols } = localGrid;
    if (rows > 0 && cols > 0) {
      // Check if we have cached results for this filter
      const filterCache =
        $SettingStore.internal.settings.widgetPane.filterCache;
      const cached = filterCache[activeFilter];

      if (cached) {
        // Use cached results
        demoWidgets = {};
        cached.placedWidgets.forEach((widget) => {
          demoWidgets[widget.id!] = widget;
        });
        minRequiredRows = cached.minRows;
        return;
      }

      // Filter widgets based on active filter
      const filteredWidgets =
        activeFilter === "All"
          ? ALL_WIDGET_DEMOS
          : ALL_WIDGET_DEMOS.filter((w) => w.filter === activeFilter);

      const placedWidgets = placeWidgetsCompactly(filteredWidgets, rows, cols);
      const calculatedMinRows = calculateMinRows(filteredWidgets, cols);

      // Cache the results in SettingStore
      SettingStore.update((state) => {
        state.internal.settings.widgetPane.filterCache[activeFilter] = {
          placedWidgets,
          minRows: calculatedMinRows,
        };
        return state;
      });

      // Update local state
      demoWidgets = {};
      placedWidgets.forEach((widget) => {
        demoWidgets[widget.id!] = widget;
      });

      minRequiredRows = calculatedMinRows;
    }
  }

  // Track previous grid dimensions and filter to avoid unnecessary updates
  let prevGridDimensions = $state({ rows: 0, cols: 0 });
  let prevFilter = $state("All");
  let isInitialized = $state(false);

  // Reactively place widgets when grid dimensions change
  $effect(() => {
    const { rows, cols } = localGrid;

    // Only place widgets once the grid is properly initialized AND dimensions have changed
    if (
      rows > 0 &&
      cols > 0 &&
      (prevGridDimensions.rows !== rows || prevGridDimensions.cols !== cols)
    ) {
      processWidgetPlacement();
      prevGridDimensions = { rows, cols };
      isInitialized = true;
    }
  });

  // Separate effect for filter changes (only after initialization)
  $effect(() => {
    if (isInitialized && prevFilter !== activeFilter) {
      processWidgetPlacement();
      prevFilter = activeFilter;
    }
  });
</script>

<div class="Widgets" bind:this={gridParent}>
  <div class="Widgets__header">
    <h2>Widgets</h2>
  </div>
  <ul
    class="Widget-filters blur-recessed"
    style="--filter-count: {FILTER_COUNT}"
  >
    {#each WIDGET_FILTERS as type}
      <li>
        <input
          class="CrispInput"
          type="radio"
          id="filter-{type}"
          name="widget-filter"
          value={type}
          checked={activeFilter === type}
          onchange={() => {
            activeFilter = type;
          }}
        />
        <label
          data-no-blur
          data-type="ghost"
          class="CrispButton"
          for="filter-{type}"
        >
          {type}
        </label>
      </li>
    {/each}
  </ul>
  {#if minRequiredRows !== null}
    <Grid
      gridGap={16}
      maxCellSize={115}
      onGridUpdate={handleGridUpdate}
      minRows={minRequiredRows}
    >
      {#each Object.keys(demoWidgets) as widgetId (widgetId)}
        {@const widget = {
          id: widgetId,
          ...demoWidgets[widgetId],
          isDemo: true,
        }}
        <div
          class="widget-wrapper"
          role="button"
          tabindex="0"
          onclick={() => handleWidgetClick(widget)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleWidgetClick(widget);
            }
          }}
          style="
            grid-column: {widget.pos.col} / span {widget.span.x};
            grid-row: {widget.pos.row} / span {widget.span.y};
          "
        >
          {#if widget.type === "test-widget"}
            <TestWidget
              {widgetId}
              gridCol={widget.pos.col}
              gridRow={widget.pos.row}
              gridSpanX={widget.span.x}
              gridSpanY={widget.span.y}
            />
          {:else if widget.type === "calendar"}
            <Calendar {widget} />
          {:else if widget.type === "cat"}
            <Cat {widget} />
          {:else if widget.type === "checklist"}
            <Checklist {widget} />
          {:else if widget.type === "analog-clock"}
            <ClockClassicAnalog {widget} />
          {:else if widget.type === "semi-digital-clock"}
            <ClockSemiDigital {widget} />
          {:else if widget.type === "flip-clock"}
            <ClockFlip {widget} />
          {/if}
        </div>
      {/each}
    </Grid>
  {/if}
</div>

<style lang="scss">
  .Widgets {
    width: 100%;
    overflow-y: auto;
    padding: 31px 25px 25px 25px;

    @include make-flex($just: flex-start, $gap: 25px);

    &__header {
      width: 100%;
      @include make-flex($dir: row, $align: center, $just: space-between);
      & > h2 {
        font-size: 26px;
        color: var(--vibrant-labels-primary);
        font-weight: 600;
      }
    }

    &__subheader {
      width: 100%;

      font-size: 23px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--vibrant-labels-primary);
    }

    :global(.grid-container) {
      padding: 0;
      @include box($height: auto);
    }

    :global(.grid) {
      max-width: 100%;
    }
  }

  .Widget-filters {
    flex-wrap: wrap;
    padding: 5px;
    list-style: none;
    position: relative;
    border-radius: 15px;
    border: 1px solid var(--separator-secondary);
    @include make-flex($dir: row, $align: center, $gap: 5px);

    & > li {
      display: flex;
      flex-direction: row;
      flex-shrink: 0;

      &:has(> input:checked) label {
        background-color: rgba(255, 255, 255, 0.24);
      }

      & > input {
        display: none;
      }

      .CrispButton {
        @include box();
        box-shadow: none;
        padding: 6px 19px;
        border: none;
        --crp-button-radius: 9px;
        --crp-button-bg-hover: rgba(255, 255, 255, 0.14);
        // --crp-button-border-hover: transparent;

        &:hover {
          border: none;
        }
      }
    }
  }

  .widget-wrapper {
    cursor: pointer;
    position: relative;
    width: 100%;
    height: 100%;
    outline: none;
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.02);

      // Blur the widget content
      & > :global(*) {
        filter: blur(2px) brightness(0.75);
      }
    }

    &::after {
      inset: 0;
      opacity: 0;
      content: "+";
      color: white;
      font-size: 32px;
      font-weight: 700;
      position: absolute;
      @include make-flex();
      border-radius: 20px;
      pointer-events: none;
      border: 2px solid var(--colors-blue);
      background: radial-gradient(
        circle at center,
        rgba(0, 145, 255, 0.3),
        rgba(80, 80, 80, 0.85)
      );
      box-shadow:
        inset 0 0 30px rgba(0, 145, 255, 0.2),
        0 4px 20px rgba(0, 0, 0, 0.5);
      transition: opacity 0.3s ease;
    }

    &:hover::after {
      opacity: 1;
    }

    &:active {
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid var(--vibrant-labels-primary);
      outline-offset: 2px;
    }

    & > :global(*) {
      pointer-events: none;
      transition: filter 0.3s ease;
    }
  }
</style>

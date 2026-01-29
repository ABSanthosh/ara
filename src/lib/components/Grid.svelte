<script lang="ts">
  import { type Snippet } from "svelte";
  import { SettingStore } from "../modules/settings/settings.store";

  interface Props {
    gridGap?: number;
    showGrid?: boolean;
    children?: Snippet;
    gridPadding?: number;
    minWidgetSize?: number;
    maxCellSize?: number;
    rows?: number;
    cols?: number;
    minRows?: number;
    minCols?: number;
    onGridUpdate?: (gridInfo: { rows: number; cols: number; cellSize: number; gap: number }) => void;
  }

  let {
    gridGap = 10,
    showGrid = false,
    gridPadding = 40,
    minWidgetSize = 115,
    maxCellSize,
    rows,
    cols,
    minRows,
    minCols,
    children,
    onGridUpdate,
  }: Props = $props();

  let gridContainer: HTMLElement;
  let grid: HTMLElement;
  let gridCols = $state(6);
  let gridRows = $state(4);
  let cellSize = $state(115);

  function calculateGrid() {
    if (!gridContainer) return;

    // Get the parent container's dimensions
    const parentWidth = gridContainer.parentElement?.clientWidth || window.innerWidth;
    const parentHeight = gridContainer.parentElement?.clientHeight || window.innerHeight;

    // Calculate the available size minus padding
    const availableWidth = parentWidth - gridPadding * 2;
    const availableHeight = parentHeight - gridPadding * 2;

    // Use hardcoded values if provided, otherwise calculate
    if (rows !== undefined && cols !== undefined) {
      gridCols = cols;
      gridRows = rows;
    } else {
      // Calculate the number of columns and rows that can fit in the available space
      gridCols = Math.floor(
        (availableWidth + gridGap) / (minWidgetSize + gridGap),
      );
      gridRows = Math.floor(
        (availableHeight + gridGap) / (minWidgetSize + gridGap),
      );

      // Apply minimum constraints if provided
      if (minCols !== undefined) {
        gridCols = Math.max(gridCols, minCols);
      }
      if (minRows !== undefined) {
        gridRows = Math.max(gridRows, minRows);
      }
    }

    // Calculate the maximum available width and height for placing widgets
    const maxWidth = availableWidth - gridGap * (gridCols - 1);
    const maxHeight = availableHeight - gridGap * (gridRows - 1);

    // Determine the cell size based on the maximum available space
    cellSize = Math.floor(Math.min(maxWidth / gridCols, maxHeight / gridRows));

    // Ensure the cell size does not go below the minimum widget size
    cellSize = Math.max(cellSize, minWidgetSize);

    // Ensure the cell size does not exceed the maximum cell size if provided
    if (maxCellSize !== undefined) {
      cellSize = Math.min(cellSize, maxCellSize);
    }

    SettingStore.update((store) => {
      store.internal.grid.rows = gridRows;
      store.internal.grid.cols = gridCols;
      store.internal.grid.gap = gridGap;
      store.internal.grid.cellSize = cellSize;
      store.internal.grid.element = grid;

      return store;
    });

    // Call the optional callback if provided
    if (onGridUpdate) {
      onGridUpdate({
        rows: gridRows,
        cols: gridCols,
        cellSize,
        gap: gridGap,
      });
    }
  }

  onMount(() => {
    calculateGrid();
    window.addEventListener("resize", calculateGrid);

    return () => {
      window.removeEventListener("resize", calculateGrid);
    };
  });
</script>

<main class="grid-container" bind:this={gridContainer}>
  <div
    class="grid"
    bind:this={grid}
    style="
    --grid-cols: {gridCols};
    --grid-rows: {gridRows};
    --cell-size: {cellSize}px;
    --grid-gap: {gridGap}px;
  "
  >
    {@render children?.()}

    {#if showGrid}
      {#each Array(gridRows) as _, row}
        {#each Array(gridCols) as _, col}
          <div
            class="grid-cell"
            data-row={row}
            data-col={col}
            style="grid-area: {row + 1} / {col + 1}"
          >
            {row + 1}, {col + 1}
          </div>
        {/each}
      {/each}
    {/if}
  </div>
</main>

<style lang="scss">
  .grid-container {
    padding: 40px;
    @include box(100vw, 100vh);
    @include make-flex($align: flex-start);

    @include respondAt(768px) {
      padding: 20px;
    }

    @include respondAt(480px) {
      padding: 10px;
    }
  }

  .grid {
    // For better widget dragging stacking order
    z-index: 1;

    display: grid;
    position: relative;
    gap: var(--grid-gap);
    place-content: center;
    grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
    grid-template-columns: repeat(var(--grid-cols), var(--cell-size));

    .grid-cell {
      z-index: -10;
      user-select: none;
      border-radius: 20px;
      pointer-events: none;
      @include make-flex();
      width: var(--cell-size);
      height: var(--cell-size);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);
      border: 1px dashed rgba(255, 255, 255, 0.3);
    }
  }
</style>

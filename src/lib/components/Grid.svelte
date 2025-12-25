<script lang="ts">
  import { type Snippet } from "svelte";
  import { SettingStore } from "../modules/settings/settings.store";

  interface Props {
    gridGap?: number;
    showGrid?: boolean;
    children?: Snippet;
    gridPadding?: number;
    minWidgetSize?: number;
  }

  let {
    gridGap = 15,
    showGrid = false,
    gridPadding = 40,
    minWidgetSize = 110,
    children,
  }: Props = $props();

  let gridContainer: HTMLElement;
  let grid: HTMLElement;
  let gridCols = $state(6);
  let gridRows = $state(4);
  let cellSize = $state(110);

  function calculateGrid() {
    if (!gridContainer) return;

    // Calculate the available viewport size minus padding
    const viewportWidth = window.innerWidth - gridPadding * 2;
    const viewportHeight = window.innerHeight - gridPadding * 2;

    // Calculate the number of columns and rows that can fit in the viewport
    gridCols = Math.floor(
      (viewportWidth + gridGap) / (minWidgetSize + gridGap)
    );
    gridRows = Math.floor(
      (viewportHeight + gridGap) / (minWidgetSize + gridGap)
    );

    // Calculate the maximum available width and height for placing widgets
    const maxWidth = viewportWidth - gridGap * (gridCols - 1);
    const maxHeight = viewportHeight - gridGap * (gridRows - 1);

    // Determine the cell size based on the maximum available space
    cellSize = Math.floor(Math.min(maxWidth / gridCols, maxHeight / gridRows));

    // Ensure the cell size does not go below the minimum widget size
    cellSize = Math.max(cellSize, minWidgetSize);

    SettingStore.update((store) => {
      store.internal.grid.rows = gridRows;
      store.internal.grid.cols = gridCols;
      store.internal.grid.gap = gridGap;
      store.internal.grid.cellSize = cellSize;
      store.internal.grid.element = grid;

      return store;
    });
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
    @include make-flex();
    @include box(100vw, 100vh);

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

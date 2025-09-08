<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from "svelte";

  // Props
  interface Props {
    minWidgetSize?: number;
    gridGap?: number;
    gridPadding?: number;
    showGrid?: boolean;
  }

  let {
    minWidgetSize = 120,
    gridGap = 10,
    gridPadding = 40,
    showGrid = true
  }: Props = $props();

  let gridContainer: HTMLElement;
  let gridCols = $state(6);
  let gridRows = $state(4);
  let cellSize = $state(120);

  // Calculate optimal grid dimensions based on viewport
  function calculateGrid() {
    if (!gridContainer) return;

    const containerWidth = window.innerWidth - (gridPadding * 2);
    const containerHeight = window.innerHeight - (gridPadding * 2);

    // Calculate how many cells can fit horizontally and vertically
    // Account for gaps between cells
    const maxCols = Math.floor((containerWidth + gridGap) / (minWidgetSize + gridGap));
    const maxRows = Math.floor((containerHeight + gridGap) / (minWidgetSize + gridGap));

    // Ensure we have at least a 3x3 grid
    gridCols = Math.max(3, maxCols);
    gridRows = Math.max(3, maxRows);

    // Calculate the actual cell size based on available space
    const availableWidth = containerWidth - (gridGap * (gridCols - 1));
    const availableHeight = containerHeight - (gridGap * (gridRows - 1));
    
    const cellWidth = availableWidth / gridCols;
    const cellHeight = availableHeight / gridRows;
    
    // Use the smaller dimension to maintain square cells
    cellSize = Math.max(minWidgetSize, Math.min(cellWidth, cellHeight));
  }

  onMount(() => {
    calculateGrid();
    
    // Recalculate on window resize
    const handleResize = () => {
      calculateGrid();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Expose grid properties for parent components
  export function getGridInfo() {
    return {
      cols: gridCols,
      rows: gridRows,
      cellSize,
      gap: gridGap
    };
  }

  // Expose grid container for draggable action
  export function getGridContainer() {
    return gridContainer;
  }

  // Expose grid element specifically
  export function getGridElement() {
    return gridContainer?.querySelector('.widget-grid') as HTMLElement;
  }

  // Expose current grid values for draggable action
  export function getCurrentGridInfo() {
    return {
      cols: gridCols,
      rows: gridRows,
      cellSize,
      gap: gridGap,
      gridElement: getGridElement()
    };
  }
</script>

<div class="widget-container" bind:this={gridContainer}>
  <div 
    class="widget-grid"
    style="
      --grid-cols: {gridCols};
      --grid-rows: {gridRows};
      --cell-size: {cellSize}px;
      --grid-gap: {gridGap}px;
    "
  >
    <!-- Render children components if provided -->
    <slot />
    
    <!-- Show grid overlay if no children and showGrid is true -->
    {#if showGrid}
      {#each Array(gridRows) as _, row}
        {#each Array(gridCols) as _, col}
          <div 
            class="grid-cell" 
            data-row={row} 
            data-col={col}
            style="grid-area: {row + 1} / {col + 1}"
          >
            <div class="cell-content">
              {row + 1},{col + 1}
            </div>
          </div>
        {/each}
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .widget-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px;
    box-sizing: border-box;
  }

  .widget-grid {
    display: grid;
    grid-template-columns: repeat(var(--grid-cols), var(--cell-size));
    grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
    gap: var(--grid-gap);
    place-content: center;
    position: relative;
    
    /* Ensure proper stacking context for dragged elements */
    z-index: 1;
  }

  .grid-cell {
    width: var(--cell-size);
    height: var(--cell-size);
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    pointer-events: none;
    
    &:hover {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
  }

  .cell-content {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 500;
    user-select: none;
  }

  // Responsive adjustments
  @media (max-width: 768px) {
    .widget-container {
      padding: 20px;
    }
  }

  @media (max-width: 480px) {
    .widget-container {
      padding: 10px;
    }
  }
</style>

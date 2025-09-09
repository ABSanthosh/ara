<svelte:options runes={true} />

<script lang="ts">
  import { draggable, type DraggableOptions } from "../../actions/draggable.svelte";
  import { resizable, type ResizableOptions } from "../../actions/resizable.svelte";

  interface Props {
    gridRow?: number;
    gridCol?: number;
    gridSpanX?: number;
    gridSpanY?: number;
    draggable?: boolean;
    resizable?: boolean;
    allowedSizes?: string[];
    title?: string;
    color?: string;
  }

  let {
    gridRow = 1,
    gridCol = 1,
    gridSpanX = 1,
    gridSpanY = 1,
    draggable: isDraggable = true,
    resizable: isResizable = true,
    allowedSizes = ["1x1", "2x2", "3x3", "2x1", "1x2"],
    title = "Widget",
    color = "#6366f1"
  }: Props = $props();

  // Current position and size state
  let currentGridRow = $state(gridRow);
  let currentGridCol = $state(gridCol);
  let currentSpanX = $state(gridSpanX);
  let currentSpanY = $state(gridSpanY);

  // Draggable options
  const draggableOptions: DraggableOptions = {
    onDragEnd: (row, col) => {
      currentGridRow = row;
      currentGridCol = col;
    }
  };

  // Resizable options
  const resizableOptions: ResizableOptions = {
    allowedSizes,
    onResize: (spanX, spanY) => {
      currentSpanX = spanX;
      currentSpanY = spanY;
    }
  };
</script>

<div
  class="test-widget BlurBG draggable-widget"
  use:draggable={draggableOptions}
  use:resizable={resizableOptions}
  style="
    grid-area: {currentGridRow} / {currentGridCol} / {currentGridRow + currentSpanY} / {currentGridCol + currentSpanX};
    --widget-color: {color};
  "
>
  <div class="widget-content">
    <h3>{title}</h3>
    <p>Position: {currentGridRow}, {currentGridCol}</p>
    <p>Size: {currentSpanX} × {currentSpanY}</p>
  </div>
</div>

<style lang="scss">
  .test-widget {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
    
    &:hover {
      border-color: var(--widget-color);
    }

    .widget-content {
      text-align: center;
      color: white;
      
      h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--widget-color);
      }
      
      p {
        margin: 5px 0;
        font-size: 12px;
        opacity: 0.8;
        font-family: 'JetBrains Mono', monospace;
      }
    }
  }
</style>

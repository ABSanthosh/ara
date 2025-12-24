<script lang="ts">
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";

  // import { draggable, type DraggableOptions } from "../../actions/draggable.svelte";
  // import { resizable, type ResizableOptions } from "../../actions/resizable.svelte";

  interface Props {
    id?: string;
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
    id = "",
    gridRow = 1,
    gridCol = 1,
    gridSpanX = 1,
    gridSpanY = 1,
    draggable: isDraggable = true,
    resizable: isResizable = true,
    allowedSizes = ["1x1", "2x2", "3x3", "2x1", "1x2"],
    title = "Widget",
    color = "#6366f1",
  }: Props = $props();

  // Current position and size state
  // svelte-ignore state_referenced_locally
  let currentGridRow = $state(gridRow);
  // svelte-ignore state_referenced_locally
  let currentGridCol = $state(gridCol);
  // svelte-ignore state_referenced_locally
  let currentSpanX = $state(gridSpanX);
  // svelte-ignore state_referenced_locally
  let currentSpanY = $state(gridSpanY);

  // // Draggable options
  // const draggableOptions: DraggableOptions = {
  //   onDragEnd: (row, col) => {
  //     currentGridRow = row;
  //     currentGridCol = col;
  //   }
  // };

  // // Resizable options
  // const resizableOptions: ResizableOptions = {
  //   allowedSizes,
  //   onResize: (spanX, spanY) => {
  //     currentSpanX = spanX;
  //     currentSpanY = spanY;
  //   }
  // };
</script>

<!-- use:draggable={draggableOptions}
use:resizable={resizableOptions} -->
<div
  class="test-widget BlurBG draggable-widget"
  style="
    grid-area: {gridRow} / {gridCol} / {gridRow + gridSpanY} / {gridCol +
    gridSpanX};
    --widget-color: {color};
  "
>
  <div class="widget-content">
    <!-- <h3>{title}</h3> -->
    <p>Position: {currentGridRow}, {currentGridCol}</p>
    <p>Size: {currentSpanX} × {currentSpanY}</p>
    <button
      onclick={() => {
        WidgetEngine.removeWidget(id);
      }}
    >
      Remove
    </button>
  </div>
</div>

<style lang="scss">
  .test-widget {
    display: grid;
    align-items: center;
    justify-content: center;
    padding: 10px;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
    border-color: var(--widget-color);

    &:hover {
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
        font-family: "JetBrains Mono", monospace;
      }
    }
  }
</style>

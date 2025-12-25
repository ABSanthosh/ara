<script lang="ts">
  import { draggable } from "../../modules/widgets/utils/draggable.svelte";

  interface Props {
    widgetId: string;
    gridRow?: number;
    gridCol?: number;
    gridSpanX?: number;
    gridSpanY?: number;
    title?: string;
    color?: string;
  }

  let {
    widgetId,
    gridRow = 1,
    gridCol = 1,
    gridSpanX = 1,
    gridSpanY = 1,
    title = "Widget",
    color = "#6366f1",
  }: Props = $props();
</script>

<div
  class="test-widget BlurBG"
  use:draggable={widgetId}
  style="
    grid-area: {gridRow} / {gridCol} / {gridRow + gridSpanY} / {gridCol +
    gridSpanX};
    --widget-color: {color};
  "
>
  <div class="widget-content">
    <h3>{title}</h3>
    <p>ID: {widgetId}</p>
    <p>Position: {gridRow}, {gridCol}</p>
    <p>Size: {gridSpanX} × {gridSpanY}</p>
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
    cursor: grab;
    user-select: none;
    border-color: var(--widget-color);

    &:active {
      cursor: grabbing;
    }

    .widget-content {
      text-align: center;
      color: white;
      pointer-events: none;

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

  :global(body.dragging) {
    cursor: grabbing;
    user-select: none;
  }
</style>

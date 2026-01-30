<script lang="ts">
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import { draggable } from "../../modules/widgets/utils/draggable.svelte";

  interface Props {
    widgetId: string;
    gridRow?: number;
    gridCol?: number;
    gridSpanX?: number;
    gridSpanY?: number;
    title?: string;
    color?: string;
    isDemo?: boolean;
  }

  let {
    widgetId,
    gridRow = 1,
    gridCol = 1,
    gridSpanX = 1,
    gridSpanY = 1,
    title = "Widget",
    color = "#6366f1",
    isDemo = false,
  }: Props = $props();
</script>

<div
  class="test-widget BlurBG"
  use:draggable={{ widgetId, isDemo }}
  style="
    grid-area: {gridRow} / {gridCol} / {gridRow + gridSpanY} / {gridCol +
    gridSpanX};
    --widget-color: {color};
  "
>
  <p>ID: {widgetId}</p>
  <p>Position: {gridRow}, {gridCol}</p>
  <p>Size: {gridSpanX} × {gridSpanY}</p>
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
    border-radius: 25px;
    background: rgba(0, 0, 0, 0.49);
    box-shadow: 0 0 20px 1px #00000087;
    backdrop-filter: blur(26px) saturate(170%) brightness(1.04);

    color: white;
    @include box();
    @include make-flex();
    text-align: center;

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
</style>

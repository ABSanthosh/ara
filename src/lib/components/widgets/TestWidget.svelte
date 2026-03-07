<script lang="ts">
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import { draggable } from "../../modules/widgets/utils/draggable.svelte";
  import { resizable } from "../../modules/widgets/utils/resizable.svelte";
  import type { TestWidget, TestWidgetSpan } from "@/lib/modules/widgets/widgets.types";

  let {
    widget,
  }: {
    widget: TestWidget & { isDemo?: boolean };
  } = $props();

  const allowedSpans: TestWidgetSpan[] = [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
  ];
</script>

<div
  class="test-widget BlurBG"
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  use:resizable={{
    widgetId: widget.id!,
    spans: allowedSpans,
    isDemo: widget.isDemo,
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row + widget.span.y} / {widget.pos.col + widget.span.x};
    --widget-color: #6366f1;
  "
>
  <p>ID: {widget.id}</p>
  <p>Position: {widget.pos.row}, {widget.pos.col}</p>
  <p>Size: {widget.span.x} × {widget.span.y}</p>
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

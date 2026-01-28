<script lang="ts">
  import { draggable } from "@/lib/modules/widgets/utils/draggable.svelte";
  import { resizable } from "@/lib/modules/widgets/utils/resizable.svelte";
  import type {
    ClockWidgetClassicAnalog,
    ClockWidgetClassicAnalogSpan,
  } from "@/lib/modules/widgets/widgets.types";

  let {
    widget,
  }: {
    widget: ClockWidgetClassicAnalog;
  } = $props();

  const config = $state<{
    size: "compact" | "large";
    allowedSpans: ClockWidgetClassicAnalogSpan[];
    resizeProgress: "idle" | "resizing";
  }>({
    // svelte-ignore state_referenced_locally
    size: widget.span.x === 1 && widget.span.y === 1 ? "compact" : "large",
    allowedSpans: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
    resizeProgress: "idle" as "idle" | "resizing",
  });
</script>

<div
  class="AnalogClock blur-thin"
  data-size={config.size}
  use:draggable={widget.id!}
  use:resizable={{
    widgetId: widget.id!,
    spans: config.allowedSpans,
    onResizeStateChange: (resizeState) =>
      (config.resizeProgress = resizeState.type),
    onResize: (newSpan) => {
      // Update size based on new span
      config.size = newSpan.x === 1 && newSpan.y === 1 ? "compact" : "large";
    },
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row +
    widget.span.y} / {widget.pos.col + widget.span.x};
  "
></div>

<style lang="scss">
  .AnalogClock {
    padding: 13px;
    border-radius: 20px;
    border: 1px solid var(--separator-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
</style>

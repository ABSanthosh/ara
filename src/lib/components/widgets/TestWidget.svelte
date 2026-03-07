<script lang="ts">
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import { draggable } from "../../modules/widgets/utils/draggable.svelte";
  import { resizable } from "../../modules/widgets/utils/resizable.svelte";
  import { flippable } from "../../modules/widgets/utils/flippable.svelte";
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

  let isFlipped = $state(false);

  function handleFlip() {
    isFlipped = true;
  }

  function handleFlipBack() {
    isFlipped = false;
  }
</script>

<!-- TODO: data-isolate-context only when editing -->
<div
  class="test-widget BlurBG"
  data-isolate-context
  use:draggable={{ widgetId: widget.id!, isDemo: widget.isDemo }}
  use:resizable={{
    widgetId: widget.id!,
    spans: allowedSpans,
    isDemo: widget.isDemo,
  }}
  use:flippable={{
    widgetId: widget.id!,
    isDemo: widget.isDemo,
    onFlip: handleFlip,
    onFlipBack: handleFlipBack,
  }}
  style="
    grid-area: {widget.pos.row} / {widget.pos.col} / {widget.pos.row + widget.span.y} / {widget.pos.col + widget.span.x};
    --widget-color: #6366f1;
  "
>
  <!-- Front view -->
  <div class="widget-front-view">
    <p>ID: {widget.id}</p>
    <p>Position: {widget.pos.row}, {widget.pos.col}</p>
    <p>Size: {widget.span.x} × {widget.span.y}</p>
    <p style="margin-top: 10px; opacity: 0.6; font-size: 10px;">Right-click to flip</p>
  </div>

  <!-- Back view -->
  <div class="widget-back-view">
    <div class="back-content">
      <h3>⚙️ Widget Settings</h3>
      <div class="setting-item">
        <label>Widget Color</label>
        <input type="color" value="#6366f1"  />
      </div>
      <div class="setting-item">
        <label>Opacity</label>
        <input type="range" min="0" max="100" value="100"  />
      </div>
      <div class="setting-item">
        <label>Border Radius</label>
        <input type="range" min="0" max="50" value="25"  />
      </div>
      <p style="margin-top: 15px; opacity: 0.6; font-size: 10px;">Click outside to flip back</p>
    </div>
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
    border-radius: 25px;
    background: rgba(0, 0, 0, 0.49);
    box-shadow: 0 0 20px 1px #00000087;
    backdrop-filter: blur(26px) saturate(170%) brightness(1.04);
    position: relative;

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

  .widget-front-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
    backface-visibility: hidden;
  }

  .back-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: 20px;
    gap: 12px;
    width: 100%;
    height: 100%;
    // background: rgba(0, 0, 0, 0.6);
    border-radius: inherit;
    backdrop-filter: blur(30px) saturate(180%) brightness(1.1);

    h3 {
      text-align: center;
      margin-bottom: 5px;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 11px;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
      }

      input[type="color"] {
        width: 100%;
        height: 35px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: transparent;
      }

      input[type="range"] {
        width: 100%;
        cursor: pointer;
      }
    }

    p {
      text-align: center;
    }
  }
</style>

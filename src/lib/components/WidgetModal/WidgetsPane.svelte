<script lang="ts">
  import settingStore, {
    addWidget as addWidgetToStore,
  } from "../../stores/setting.store";
  import type {
    AnalogClockSpan,
    FlipClockSpan,
    CalendarSpan,
    CatSpan,
    ChecklistSpan,
  } from "../../stores/setting.store";
  import { Clock, Calendar, Cat, CheckSquare, Clock4 } from "@lucide/svelte";

  // Import actual widget components for previews
  import AnalogClock from "../widgets/clock/AnalogClock.svelte";
  import FlipClock from "../widgets/clock/FlipClock.svelte";
  import CalendarWidget from "../widgets/Calendar.svelte";
  import CatWidget from "../widgets/Cat.svelte";
  import ChecklistWidget from "../widgets/Checklist.svelte";

  // Widget configurations with their possible formats
  const widgetConfigs = [
    {
      type: "analog-clock",
      name: "Analog Clock",
      description: "Traditional clock face with customizable timezone",
      icon: Clock,
      formats: [
        {
          span: { x: 1, y: 1 },
          name: "Compact",
          description: "Small analog clock",
        },
        {
          span: { x: 2, y: 2 },
          name: "Large",
          description: "Full-size analog clock with details",
        },
      ] as { span: AnalogClockSpan; name: string; description: string }[],
    },
    {
      type: "flip-clock",
      name: "Flip Clock",
      description: "Digital flip-style clock with timezone support",
      icon: Clock4,
      formats: [
        {
          span: { x: 2, y: 1 },
          name: "Compact",
          description: "Horizontal flip clock",
        },
        {
          span: { x: 2, y: 2 },
          name: "Large",
          description: "Large flip clock with seconds",
        },
      ] as { span: FlipClockSpan; name: string; description: string }[],
    },
    {
      type: "calendar",
      name: "Calendar",
      description: "Full calendar with date navigation",
      icon: Calendar,
      formats: [
        {
          span: { x: 1, y: 1 },
          name: "Compact",
          description: "Mini calendar view",
        },
        {
          span: { x: 2, y: 2 },
          name: "Full",
          description: "Complete calendar with navigation",
        },
      ] as { span: CalendarSpan; name: string; description: string }[],
    },
    {
      type: "cat",
      name: "Cat Widget",
      description: "Random cat images from Reddit",
      icon: Cat,
      formats: [
        {
          span: { x: 1, y: 1 },
          name: "Small",
          description: "Compact cat image",
        },
        {
          span: { x: 2, y: 2 },
          name: "Large",
          description: "Large cat image display",
        },
      ] as { span: CatSpan; name: string; description: string }[],
    },
    {
      type: "checklist",
      name: "Checklist",
      description: "Todo list with checkable items",
      icon: CheckSquare,
      formats: [
        {
          span: { x: 2, y: 2 },
          name: "Standard",
          description: "Todo list with add/remove functionality",
        },
      ] as { span: ChecklistSpan; name: string; description: string }[],
    },
  ];

  // Add widget to the grid
  function addWidget(type: string, span: any, formatName: string) {
    addWidgetToStore(type, span);
  }

  // Drag and drop functionality for widget previews
  let draggedWidget: { type: string; span: any; formatName: string } | null =
    null;

  function handleDragStart(
    event: DragEvent,
    type: string,
    span: any,
    formatName: string
  ) {
    draggedWidget = { type, span, formatName };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ type, span, formatName })
      );
    }
  }

  function handleDragEnd() {
    draggedWidget = null;
  }
</script>

<div class="WidgetsPane">
  <h2 class="WidgetsPane__header">Widgets</h2>
  <p class="WidgetsPane__description">
    Choose from various widgets and drag them to your grid. Each widget supports
    different sizes and formats.
  </p>

  <div class="WidgetsPane__grid">
    {#each widgetConfigs as config}
      <div class="WidgetGroup">
        <div class="WidgetGroup__header">
          <div class="WidgetGroup__info">
            <svelte:component this={config.icon} size={24} />
            <div>
              <h3 class="WidgetGroup__name">{config.name}</h3>
              <p class="WidgetGroup__description">{config.description}</p>
            </div>
          </div>
        </div>
        <div class="WidgetGroup__formats">
          {#each config.formats as format}
            <div class="WidgetFormat">
              <div
                class="WidgetFormat__preview"
                class:size-1x1={format.span.x === 1 && format.span.y === 1}
                class:size-2x1={format.span.x === 2 && format.span.y === 1}
                class:size-2x2={format.span.x === 2 && format.span.y === 2}
                draggable="true"
                role="button"
                tabindex="0"
                on:dragstart={(e) =>
                  handleDragStart(e, config.type, format.span, format.name)}
                on:dragend={handleDragEnd}
                on:click={() =>
                  addWidget(config.type, format.span, format.name)}
                on:keydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addWidget(config.type, format.span, format.name);
                  }
                }}
              >
                <div class="widget-preview-container">
                  {#if config.type === "analog-clock"}
                    <AnalogClock
                      id="preview-analog-{format.span.x}x{format.span.y}"
                      pos={{ row: 0, col: 0 }}
                      span={format.span as AnalogClockSpan}
                      settings={{
                        showNumbers: true,
                        showSecondsHand:
                          format.span.x === 2 && format.span.y === 2,
                      }}
                      onDragEnd={() => {}}
                      onResize={() => {}}
                    />
                  {:else if config.type === "flip-clock"}
                    <FlipClock
                      id="preview-flip-{format.span.x}x{format.span.y}"
                      pos={{ row: 0, col: 0 }}
                      span={format.span as FlipClockSpan}
                      settings={{
                        showSeconds: format.span.y === 2,
                      }}
                      onDragEnd={() => {}}
                      onResize={() => {}}
                    />
                  {:else if config.type === "calendar"}
                    <CalendarWidget
                      id="preview-calendar-{format.span.x}x{format.span.y}"
                      pos={{ row: 0, col: 0 }}
                      span={format.span as CalendarSpan}
                      settings={{}}
                      onDragEnd={() => {}}
                      onResize={() => {}}
                    />
                  {:else if config.type === "cat"}
                    <CatWidget
                      id="preview-cat-{format.span.x}x{format.span.y}"
                      pos={{ row: 0, col: 0 }}
                      span={format.span as CatSpan}
                      settings={{}}
                      onDragEnd={() => {}}
                      onResize={() => {}}
                    />
                  {:else if config.type === "checklist"}
                    <ChecklistWidget
                      id="preview-checklist-{format.span.x}x{format.span.y}"
                      pos={{ row: 0, col: 0 }}
                      span={format.span as ChecklistSpan}
                      settings={{
                        items: [
                          { id: "1", text: "Sample task", completed: false },
                          { id: "2", text: "Completed task", completed: true },
                        ],
                      }}
                      onDragEnd={() => {}}
                      onResize={() => {}}
                    />
                  {/if}
                </div>

                <div class="WidgetFormat__overlay">
                  <span class="add-icon">+</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  @use "../../../styles/mixins.scss" as *;

  .WidgetsPane {
    display: flex;
    flex-direction: column;
    gap: 20px;

    &__header {
      font-size: 24px;
      color: #f4f4f4;
      font-weight: 600;
      margin: 0;
    }

    &__description {
      color: #bbb;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }

    &__grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }

  .WidgetGroup {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &__header {
      margin-bottom: 16px;
    }

    &__info {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #f4f4f4;

      svg {
        color: #338cec;
        flex-shrink: 0;
      }
    }

    &__name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #f4f4f4;
    }

    &__description {
      font-size: 14px;
      color: #bbb;
      margin: 0;
      line-height: 1.4;
    }

    &__formats {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
    }
  }

  .WidgetFormat {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;

    &__preview {
      position: relative;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;

      /* Use actual grid cell sizes - 120px is the standard cell size */
      --cell-size: 120px;
      --gap: 10px;

      &.size-1x1 {
        width: var(--cell-size);
        height: var(--cell-size);
      }

      &.size-2x1 {
        width: calc(2 * var(--cell-size) + var(--gap));
        height: var(--cell-size);
      }

      &.size-2x2 {
        width: calc(2 * var(--cell-size) + var(--gap));
        height: calc(2 * var(--cell-size) + var(--gap));
      }

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: #338cec;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(51, 140, 236, 0.3);

        .WidgetFormat__overlay {
          opacity: 1;
        }
      }

      &:active {
        transform: translateY(0);
      }
    }

    .widget-preview-container {
      width: 100%;
      height: 100%;
      position: relative;
      pointer-events: none; /* Prevent interaction with preview widgets */

      /* Override widget positioning for preview - make them fill the container */
      :global([data-widget]) {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        transform: none !important;
      }
    }

    &__overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(51, 140, 236, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;

      .add-icon {
        font-size: 24px;
        color: #338cec;
        font-weight: bold;
      }
    }

    &__info {
      text-align: center;
    }

    &__name {
      font-size: 14px;
      font-weight: 600;
      color: #f4f4f4;
      margin: 0 0 4px 0;
    }

    &__description {
      font-size: 12px;
      color: #aaa;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    &__size {
      font-size: 11px;
      color: #777;
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
  }

  // Responsive adjustments
  @media (max-width: 768px) {
    .WidgetGroup__formats {
      grid-template-columns: 1fr;
    }
  }
</style>

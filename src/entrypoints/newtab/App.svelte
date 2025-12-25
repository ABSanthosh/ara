<script lang="ts">
  import { WallpaperManagerImpl } from "@/lib/modules/wallpaper/wallpaper.manager";
  import "../../styles/index.scss";
  import Grid from "@/lib/components/Grid.svelte";
  import TestWidget from "@/lib/components/widgets/TestWidget.svelte";
  import { SettingStore } from "@/lib/modules/settings/settings.store";
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import WidgetModal from "@/lib/components/WidgetModal.svelte";

  // Init modules
  const wallpaperManager = new WallpaperManagerImpl();
  const settingState = $derived(SettingStore.state);

  let showSettingModal = $state(true);
</script>

<WidgetModal bind:showModal={showSettingModal} />

<Grid>
  {#each Object.keys($settingState.widgets) as widgetId}
    {@const widget = $settingState.widgets[widgetId]}
    {#if widget.type === "test-widget"}
      <TestWidget
        {widgetId}
        gridCol={widget.pos.col}
        gridRow={widget.pos.row}
        gridSpanX={widget.span.x}
        gridSpanY={widget.span.y}
      />
    {/if}
  {/each}
</Grid>

<button
  style="right: 200px"
  onclick={() => {
    const combos = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ];

    WidgetEngine.addWidget({
      settings: {},
      type: "test-widget",
      pos: { row: 1, col: 1 },
      span: combos[Math.floor(Math.random() * combos.length)],
    });
  }}
>
  Add Widget
</button>

<button
  style="right: 20px"
  onclick={() => {
    SettingStore.update((store) => {
      store.options.isDraggable = !store.options.isDraggable;
      return store;
    });
  }}
>
  {$settingState.options.isDraggable ? "Disable" : "Enable"} Dragging
</button>

<style lang="scss">
  button {
    position: fixed;
    bottom: 20px;
    padding: 12px 24px;
    background: rgba(99, 102, 241, 0.9);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    z-index: 1000;

    &:hover {
      background: rgba(99, 102, 241, 1);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
</style>

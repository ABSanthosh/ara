<script lang="ts">
  import { WallpaperManagerImpl } from "@/lib/modules/wallpaper/wallpaper.manager";
  import "../../styles/index.scss";
  import Grid from "@/lib/components/Grid.svelte";
  import TestWidget from "@/lib/components/widgets/TestWidget.svelte";
  import { SettingStore } from "@/lib/modules/settings/settings.store";
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";

  // Init modules
  const wallpaperManager = new WallpaperManagerImpl();
  const settingState = $derived(SettingStore.state);
</script>

<Grid>
  {#each Object.keys($settingState.widgets) as widgetId}
    {@const widget = $settingState.widgets[widgetId]}
    <!-- {$inspect(widget)} -->
    {#if widget.type === "test-widget"}
      <TestWidget
        id={widgetId}
        gridCol={widget.pos.col}
        gridRow={widget.pos.row}
        gridSpanX={widget.span.x}
        gridSpanY={widget.span.y}
      />
    {/if}
  {/each}
</Grid>

<button
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

<style lang="scss">
</style>

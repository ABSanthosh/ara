<script lang="ts">
  import { onDestroy } from "svelte";
  import { WallpaperManager } from "@/lib/modules/wallpaper/wallpaper.manager";
  import "../../styles/index.scss";
  import Grid from "@/lib/components/Grid.svelte";
  import TestWidget from "@/lib/components/widgets/TestWidget.svelte";
  import { SettingStore } from "@/lib/modules/settings/settings.store";
  import Settings from "@/lib/components/Settings/Settings.svelte";
  import ContextMenu from "@/lib/components/ContextMenu.svelte";
  import { Heart, Pin, PinOff } from "@lucide/svelte";
  import { WidgetEngine } from "@/lib/modules/widgets/widgets.engine";
  import Spinner from "@/lib/components/Spinner/Spinner.svelte";
  import { AppStateStore } from "@/lib/modules/settings/appState.store";
  import Modal from "@/lib/components/Modal.svelte";

  // Init modules
  const settingState = $state(SettingStore.state);
  const appState = $derived(AppStateStore);

  let showSettingModal = $state(false);
  let showNASAWallpaperInfo = $state(false);

  onDestroy(() => {
    SettingStore.destroy();
    WallpaperManager.destroy();
  });

  const NasaContextMenu = $derived(
    $settingState.wallpaper.activePlugin === "nasa"
      ? [
          {
            name: "hr",
            displayText: "",
            onClick: () => {},
          },
          {
            name: "Refresh Wallpaper",
            displayText: "Refresh Wallpaper",
            onClick: () => {
              WallpaperManager.refreshNASA();
            },
          },
        ]
      : [],
  );

  let isPinned = $derived(
    $settingState.wallpaper.activePlugin === "nasa" &&
      $settingState.wallpaper.plugins.nasa.mode === "static",
  );
  let isFavorited = $derived(
    $settingState.wallpaper.activePlugin === "nasa" &&
      $settingState.wallpaper.plugins.nasa.favorites.includes(
        $settingState.wallpaper.plugins.nasa.metadata!.date,
      ),
  );
</script>

<ContextMenu
  menuItems={[
    {
      name: "settings",
      onClick: () => (showSettingModal = true),
      displayText: "Settings",
    },
    {
      name: "showGrid",
      onClick: () => {
        SettingStore.update((store) => {
          store.options.showGrid = !store.options.showGrid;
          return store;
        });
      },
      displayText: $settingState.options.showGrid ? "Hide Grid" : "Show Grid",
    },
    {
      name: "Edit Widgets",
      onClick: () => {
        SettingStore.update((store) => {
          store.options.isResizable = !store.options.isResizable;
          store.options.isDraggable = !store.options.isDraggable;
          return store;
        });
      },
      displayText: $settingState.options.isResizable
        ? "Stop Editing"
        : "Edit Widgets",
    },
    ...NasaContextMenu,
  ]}
/>

<Settings bind:showModal={showSettingModal} />

<Grid showGrid={$settingState.options.showGrid}>
  {#each Object.keys($settingState.widgets) as widgetId (widgetId)}
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

{#if $settingState.wallpaper.activePlugin === "nasa"}
  <div class="NasaTools">
    {#if $appState.wallpaper.isWallpaperLoading}
      <div class="SpinnerButton CrispButton blur-thin" data-no-hover>
        <Spinner height={18} width={18} />
      </div>
    {/if}
    <button
      class="CrispButton blur-thin"
      data-no-blur
      data-type="fav"
      class:favorited={isFavorited}
      onclick={() => {
        if (isFavorited) {
          WallpaperManager.NASAEngine.removeNasaFavorite(
            $settingState.wallpaper.plugins.nasa.metadata!.date,
          );
        } else {
          WallpaperManager.NASAEngine.addNasaFavorite(
            $settingState.wallpaper.plugins.nasa.metadata!.date,
          );
        }
      }}
    >
      <Heart size={15} />
    </button>
    <button
      class="CrispButton blur-thin"
      data-no-blur
      class:pinned={isPinned}
      data-type="pin"
      onclick={() => {
        if (isPinned) {
          WallpaperManager.NASAEngine.unpinCurrentNasaAPOD();
        } else {
          WallpaperManager.NASAEngine.pinCurrentNasaAPOD();
        }
      }}
    >
      {#if isPinned}
        <PinOff size={15} />
      {:else}
        <Pin size={15} />
      {/if}
    </button>
    <button
      id="nasa-info-button"
      class="CrispButton blur-thin"
      data-type="info"
      class:active={showNASAWallpaperInfo}
      data-no-blur
      style="anchor-name: --nasa-info-button;"
      onclick={() => {
        // showNASAWallpaperInfo = true;
        WidgetEngine.addWidget({
          settings: {},
          type: "test-widget",
          span: { x: 2, y: 2 },
          pos: { col: 1, row: 1 },
        });
      }}
    >
      <p>+</p>
    </button>
  </div>

  {#if showNASAWallpaperInfo}
    <Modal
      heading={$settingState.wallpaper.plugins.nasa.metadata!.title}
      bind:showModal={showNASAWallpaperInfo}
    >
      <div class="WallpaperDetails">
        <p>{$settingState.wallpaper.plugins.nasa.metadata!.explanation}</p>
        {#if $settingState.wallpaper.plugins.nasa.metadata!.copyright}
          <p>© {$settingState.wallpaper.plugins.nasa.metadata!.copyright}</p>
        {/if}
        <div class="WallpaperDetails--calltoaction">
          <a
            href={$settingState.wallpaper.plugins.nasa.metadata!.page_url}
            target="_blank"
          >
            Website
          </a>
          <a
            href={$settingState.wallpaper.plugins.nasa.metadata!.url}
            target="_blank"
          >
            View full image
          </a>
        </div>
      </div>
    </Modal>
  {/if}
{/if}

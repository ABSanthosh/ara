<script lang="ts">
  import settingStore from "../../lib/stores/settingStore";
  import WidgetGrid from "../../lib/components/WidgetGrid.svelte";
  import Calendar from "../../lib/components/widgets/Calendar.svelte";
  import FlipClock from "../../lib/components/widgets/clock/FlipClock.svelte";
  import AnalogClock from "@/lib/components/widgets/clock/AnalogClock.svelte";
  import Cat from "../../lib/components/widgets/Cat.svelte";
  import Checklist from "../../lib/components/widgets/Checklist.svelte";
  import ContextMenu from "@/lib/components/ContextMenu.svelte";
  import WidgetModal from "@/lib/components/WidgetModal/WidgetModal.svelte";
  import {
    initializeWallpaper,
    WallpaperManager,
    setDynamicWallpaper,
  } from "../../lib/managers/wallpaperManager";
  import { onMount } from "svelte";
  import Modal from "@/lib/components/Modal.svelte";
  import { removeWidget } from "../../lib/stores/settingStore";
  import { Heart, Pin, PinOff } from "@lucide/svelte";

  settingStore.subscribe((value) => {
    document.body.style.backgroundImage = `url(${value.options.wallpaper.url})`;
  });

  let showModal = $state(false);
  let settingsModalWidgetId = $state<undefined | string>(undefined);
  let settingsModal = $derived(
    settingsModalWidgetId !== undefined ? true : false
  );

  let showNASAWallpaperInfo = $state(false);

  // Derived value to check if wallpaper is pinned (static mode)
  const isPinned = $derived(
    $settingStore.options.wallpaper.type === "nasa" &&
      $settingStore.options.wallpaper.metadata.mode === "static"
  );

  // Derived value to determine if widgets are in editable mode
  const isEditable = $derived(
    $settingStore.options.isDraggable && $settingStore.options.isResizable
  );

  onMount(() => {
    initializeWallpaper();
    console.log($settingStore.options.wallpaper);
  });

  const NasaContextMenu = $derived(
    $settingStore.options.wallpaper.type === "nasa"
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
              WallpaperManager.refreshNASAWallpaper();
            },
          },
        ]
      : []
  );
</script>

<ContextMenu
  menuItems={[
    {
      name: "settings",
      onClick: () => (showModal = true),
      displayText: "Settings",
    },
    {
      name: "showGrid",
      onClick: () => {
        settingStore.update((store) => {
          store.options.showGrid = !store.options.showGrid;
          return store;
        });
      },
      displayText: $settingStore.options.showGrid ? "Hide Grid" : "Show Grid",
    },
    {
      name: "Edit Widgets",
      onClick: () => {
        settingStore.update((store) => {
          store.options.isResizable = !store.options.isResizable;
          store.options.isDraggable = !store.options.isDraggable;
          return store;
        });
      },
      displayText: $settingStore.options.isResizable
        ? "Stop Editing"
        : "Edit Widgets",
    },
    ...NasaContextMenu,
  ]}
/>

<WidgetModal bind:showModal />

<Modal
  heading="Widget Settings"
  bind:showModal={settingsModal}
  onclose={() => (settingsModalWidgetId = undefined)}
>
  Settings for widget ID: {settingsModalWidgetId}
</Modal>

<WidgetGrid
  gridGap={10}
  gridPadding={40}
  minWidgetSize={110}
  showGrid={$settingStore.options.showGrid}
>
  {#each Object.keys($settingStore.widgets) as widgetId}
    {@const widget = $settingStore.widgets[widgetId]}
    {#if widget.type === "analog-clock"}
      <AnalogClock
        id={widget.id}
        pos={widget.pos}
        span={widget.span}
        settings={widget.settings}
        {isEditable}
        openSettings={(id) => (settingsModalWidgetId = id)}
        onDragEnd={(newRow, newCol) => {
          settingStore.update((store) => {
            store.widgets[widgetId].pos = { row: newRow, col: newCol };
            return store;
          });
        }}
        onResize={(newSpan) => {
          settingStore.update((store) => {
            store.widgets[widgetId].span = newSpan;
            return store;
          });
        }}
        onRemove={() => {
          removeWidget(widgetId);
        }}
      />
    {:else if widget.type === "flip-clock"}
      <FlipClock
        id={widget.id}
        pos={widget.pos}
        span={widget.span}
        settings={widget.settings}
        {isEditable}
        openSettings={(id) => (settingsModalWidgetId = id)}
        onDragEnd={(newRow, newCol) => {
          settingStore.update((store) => {
            store.widgets[widgetId].pos = { row: newRow, col: newCol };
            return store;
          });
        }}
        onResize={(newSpan) => {
          settingStore.update((store) => {
            store.widgets[widgetId].span = newSpan;
            return store;
          });
        }}
        onRemove={() => {
          removeWidget(widgetId);
        }}
      />
    {:else if widget.type === "calendar"}
      <Calendar
        id={widget.id}
        pos={widget.pos}
        span={widget.span}
        settings={widget.settings}
        {isEditable}
        openSettings={(id) => (settingsModalWidgetId = id)}
        onDragEnd={(newRow, newCol) => {
          settingStore.update((store) => {
            store.widgets[widgetId].pos = { row: newRow, col: newCol };
            return store;
          });
        }}
        onResize={(newSpan) => {
          settingStore.update((store) => {
            store.widgets[widgetId].span = newSpan;
            return store;
          });
        }}
        onRemove={() => {
          removeWidget(widgetId);
        }}
      />
    {:else if widget.type === "cat"}
      <Cat
        id={widget.id}
        pos={widget.pos}
        span={widget.span}
        settings={widget.settings}
        {isEditable}
        openSettings={(id) => (settingsModalWidgetId = id)}
        onDragEnd={(newRow, newCol) => {
          settingStore.update((store) => {
            store.widgets[widgetId].pos = { row: newRow, col: newCol };
            return store;
          });
        }}
        onResize={(newSpan) => {
          settingStore.update((store) => {
            store.widgets[widgetId].span = newSpan;
            return store;
          });
        }}
        onRemove={() => {
          removeWidget(widgetId);
        }}
      />
    {:else if widget.type === "checklist"}
      <Checklist
        id={widget.id}
        pos={widget.pos}
        span={widget.span}
        settings={widget.settings}
        {isEditable}
        openSettings={(id) => (settingsModalWidgetId = id)}
        onDragEnd={(newRow, newCol) => {
          settingStore.update((store) => {
            store.widgets[widgetId].pos = { row: newRow, col: newCol };
            return store;
          });
        }}
        onResize={(newSpan) => {
          settingStore.update((store) => {
            store.widgets[widgetId].span = newSpan;
            return store;
          });
        }}
        onRemove={() => {
          removeWidget(widgetId);
        }}
      />
    {/if}
  {/each}
</WidgetGrid>

{#if $settingStore.options.wallpaper.type === "nasa"}
  <div class="NasaTools">
    <button class="WallpaperDetailsButton BlurBG" onclick={() => {}}>
      <Heart size={15} />
    </button>
    <button
      class="WallpaperDetailsButton BlurBG"
      class:pinned={isPinned}
      onclick={() => {
        if (isPinned) {
          // Unpin: switch to dynamic mode
          setDynamicWallpaper("dynamic");
        } else {
          // Pin: switch to static mode with current image date
          const currentDate =
            $settingStore.options.wallpaper.metadata.date ||
            new Date().toISOString().split("T")[0];
          setDynamicWallpaper("static", currentDate);
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
      class="WallpaperDetailsButton BlurBG"
      onclick={() => (showNASAWallpaperInfo = true)}
    >
      ?
    </button>
  </div>

  <Modal
    heading={$settingStore.options.wallpaper.metadata.title}
    bind:showModal={showNASAWallpaperInfo}
  >
    <div class="WallpaperDetails">
      <p>{$settingStore.options.wallpaper.metadata.explanation}</p>
      {#if $settingStore.options.wallpaper.metadata.copyright}
        <p>© {$settingStore.options.wallpaper.metadata.copyright}</p>
      {/if}
      <div class="WallpaperDetails--calltoaction">
        <a
          href={$settingStore.options.wallpaper.metadata.page_url}
          target="_blank"
        >
          Website
        </a>
        <a href={$settingStore.options.wallpaper.metadata.url} target="_blank">
          View full image
        </a>
      </div>
    </div>
  </Modal>
{/if}

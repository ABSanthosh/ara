<script lang="ts">
  import Cat from "$components/Cat.svelte";
  import options from "$stores/OptionStore";
  import draggable from "$actions/draggable";
  import Notes from "$components/Notes.svelte";
  import settingStore from "$stores/SettingStore";
  import Sidebar from "$components/Sidebar.svelte";
  import FlipClock from "$components/Clocks/FlipClock.svelte";
  import AnalogClock from "$components/Clocks/AnalogClock.svelte";

  import Settings from "$pageComponents/Settings.svelte";

  let showSettings = true;
  $: isClosed = $options.sidebarIsClosed;

</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unitab</title>
</svelte:head>

<main
  class="Home"
  style="grid-template-columns: {isClosed ? '315px 1fr' : '0fr 1fr'};"
>
  <Settings show={showSettings} />
  <Sidebar />
  <div class="Home__tiles">
    {#each Object.keys($settingStore.widgets) as widgetID}
      {#if $settingStore.widgets[widgetID].enabled}
        {#if $settingStore.widgets[widgetID].id === "clock-analog"}
          <AnalogClock id={widgetID} />
        {:else if $settingStore.widgets[widgetID].id === "clock-flip"}
          <FlipClock id={widgetID} />
        {:else if $settingStore.widgets[widgetID].id === "notes"}
          <Notes id={widgetID} />
        {:else if $settingStore.widgets[widgetID].id === "cat-reddit"}
          <Cat id={widgetID} />
        {:else if $settingStore.widgets[widgetID].id === "empty"}
          <div
            id={widgetID}
            class="BlurBG"
            style="height: 147.5px; width: 147.5px"
            use:draggable
          />
        {/if}
      {/if}
    {/each}
    <button
      on:click={() => {
        showSettings = !showSettings;
      }}
    >
      Settings
    </button>
  </div>
</main>

<style lang="scss">
  .Home {
    @include box();
    gap: 20px;
    display: grid;
    transition: all 0.3s ease;
    max-width: 100%;
    max-height: 100%;

    &__tiles {
      gap: 20px;
      @include box(auto);
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      position: relative;
      // max-height: inherit;
      // max-width: inherit;
      // // overflow-y: hidden;
      // flex-wrap: wrap;
      // align-content: flex-end;
      // flex-flow: column;
      // @include make-flex($align: flex-end, $just: flex-end);
    }
  }
</style>

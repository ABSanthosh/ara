<script lang="ts">
  import Cat from "$components/Cat.svelte";
  import Sidebar from "$components/Sidebar.svelte";
  import FlipClock from "$components/Clocks/FlipClock.svelte";
  import AnalogClock from "$components/Clocks/AnalogClock.svelte";
  import options from "$stores/OptionStore";
  import Notes from "$components/Notes.svelte";
  import draggable from "$actions/draggable";

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
  <Sidebar />
  <div class="Home__tiles">
    <Notes />
    <FlipClock />
    <AnalogClock />
    <Cat />
    <!-- <div
      style="display: flex; gap: 20px; flex-wrap: wrap; width: 315px; height: fit-content"
    > -->
    <div class="BlurBG" style="height: 147.5px; width: 147.5px" use:draggable />
    <div class="BlurBG" style="height: 147.5px; width: 147.5px" use:draggable />
    <div class="BlurBG" style="height: 147.5px; width: 147.5px" use:draggable />
    <div class="BlurBG" style="height: 147.5px; width: 147.5px" use:draggable />
  </div>
  <!-- </div> -->
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

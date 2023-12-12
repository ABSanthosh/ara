<script lang="ts">
  import Cat from "$components/Cat.svelte";
  import Sidebar from "$components/Sidebar.svelte";
  import FlipClock from "$components/Clocks/FlipClock.svelte";
  import AnalogClock from "$components/Clocks/AnalogClock.svelte";

  $: isClosed = false;
</script>

<main
  class="Home"
  style="grid-template-columns: {isClosed ? '315px 1fr' : '0fr 1fr'};"
>
  <Sidebar />
  <div class="Home__tiles">
    <!-- <div style="display: flex; gap: 20px">
      <div class="BlurBG" style="height: 147.5px; width: 147.5px" />
      <div class="BlurBG" style="height: 147.5px; width: 147.5px" />
    </div> -->
    <FlipClock />
    <AnalogClock />
    <Cat />
  </div>
</main>

<style lang="scss">
  .Home {
    @include box();
    gap: 20px;
    display: grid;
    transition: all 0.3s ease;

    &__tiles {
      gap: 20px;
      @include box(auto);
      max-width: 100%;
      max-height: 100%;
      @include make-flex($align: flex-end, $just: flex-end);
    }
  }
</style>

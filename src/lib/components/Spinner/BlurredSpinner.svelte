<script lang="ts">
  import { type Snippet } from "svelte";
  import Spinner from "./Spinner.svelte";

  const {
    zIndex = 10,
    children,
    noBlur = false,
  }: {
    zIndex?: number;
    children?: Snippet;
    noBlur?: boolean;
  } = $props();
</script>

<div class="BlurredSpinner" data-blur={noBlur} style="z-index: {zIndex}">
  {@render children?.()}

  <Spinner />
</div>

<style lang="scss">
  .BlurredSpinner {
    top: 0;
    left: 0;
    @include box();
    position: absolute;
    backdrop-filter: none;
    border-radius: inherit;
    background: transparent;
    @include make-flex($gap: 8px);

    &[data-blur="true"] {
      background: rgba(0, 0, 0, 0.49);
      backdrop-filter: blur(15px);
    }
  }
</style>

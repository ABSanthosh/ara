<script lang="ts">
  import { type Snippet } from "svelte";
  import Spinner from "./Spinner.svelte";

  const {
    zIndex = 10,
    children,
    className,
    noBlur = false,
  }: {
    zIndex?: number;
    noBlur?: boolean;
    children?: Snippet;
    className?: string;
  } = $props();
</script>

<div class="BlurredSpinner {className}" class:blur-thin={!noBlur} style="z-index: {zIndex}">
  <Spinner />
  {@render children?.()}
</div>

<style lang="scss">
  .BlurredSpinner {
    top: 0;
    left: 0;
    @include box();
    position: absolute;
    // backdrop-filter: none;
    border-radius: inherit;
    // background: transparent;
    @include make-flex($gap: 8px);

    // &[data-blur="false"] {
    //   background: rgba(0, 0, 0, 0.49);
    //   backdrop-filter: blur(15px);
    // }
  }
</style>

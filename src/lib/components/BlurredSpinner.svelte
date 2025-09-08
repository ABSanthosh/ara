<script lang="ts">
  import { type Snippet } from "svelte";
  import Spinner from "./Spinner.svelte";

  const {
    zIndex = 10,
    children,
    noBlur = false,
  }: {
    zIndex?: number;
    children: Snippet;
    noBlur?: boolean;
  } = $props();
</script>

<div class="BlurredSpinner" data-blur={noBlur} style="z-index: {zIndex}">
  {@render children?.()}

  <Spinner />
</div>

<style lang="scss">
  @use "../../styles/mixins.scss" as *;

  .BlurredSpinner {
    top: 0;
    left: 0;
    gap: 8px;
    @include box();
    position: absolute;
    @include make-flex();
    backdrop-filter: none;
    border-radius: inherit;
    background: transparent;

    &[data-blur="true"] {
      background: rgba(0, 0, 0, 0.49);
      backdrop-filter: blur(15px);
    }
  }
</style>

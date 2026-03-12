<script lang="ts">
</script>

<div class="General">
  <div class="General__header">
    <h2>General</h2>
  </div>
</div>

<style lang="scss">
  .General {
    width: 100%;
    overflow-y: auto;
    padding: 31px 25px 25px 25px;

    @include make-flex($just: flex-start);

    &__header {
      width: 100%;
      @include make-flex($dir: row, $align: center, $just: space-between);
      & > h2 {
        font-size: 26px;
        color: var(--vibrant-labels-primary);
        font-weight: 600;
      }
    }
  }
</style>

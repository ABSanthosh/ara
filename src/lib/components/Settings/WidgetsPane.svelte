<script lang="ts">
</script>

<div class="Widgets">
  <div class="Widgets__header">
    <h2>Widgets</h2>
  </div>
</div>

<style lang="scss">
  .Widgets {
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

    &__subheader {
      width: 100%;

      font-size: 23px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--vibrant-labels-primary);
    }
  }
</style>

<script lang="ts">
  export let { checked, id } = $$props;
</script>

<label class="Switch" class:checked for={id}>
  <input type="checkbox" {id} bind:checked on:change />
  <div />
</label>

<style lang="scss">
  .Switch {
    cursor: pointer;
    font-size: 20px;
    border-radius: 1em;
    position: relative;
    display: inline-block;
    @include box(40px, 20px);
    background-size: 200% 200%;
    background-position: right;
    transition: background-position 300ms;
    background-image: linear-gradient(to right, #4cd964 50%, #c6c5c2 0);

    &.checked {
      // https://stackoverflow.com/a/58452190/10376131
      background-position: left;
    }
    & > input {
      position: absolute;
      cursor: pointer;
      @include box();
      opacity: 0;

      &:checked + div {
        left: calc(100% - 20px);
      }
    }

    & > div {
      position: absolute;
      @include box(20px, 20px);
      border-radius: 50%;
      cursor: pointer;
      left: 0;
      background: #fff;
      box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.3);
      transition: all 300ms;
    }
  }
</style>

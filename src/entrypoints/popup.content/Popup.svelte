<script lang="ts">
</script>

<main class="Popup">
  <!-- content -->
</main>

<style lang="scss">
  .Popup {
    top: 20px;
    right: 15px;
    z-index: 99999999;
    position: fixed;
    border-radius: 15px;
    background-color: #fff;
    @include box(325px, 500px);
    transform-origin: 301px 0px;
    backdrop-filter: blur(50px);
    box-shadow: 0 11px 34px rgba(0, 0, 0, 0.16);

    animation: fadeInAndScale 0.2s cubic-bezier(0.25, 0.1, 0.25, 1.3);
  }

  @keyframes fadeInAndScale {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

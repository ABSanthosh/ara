<script lang="ts">
  import { WallpaperManagerImpl } from "@/lib/modules/wallpaper/wallpaper.manager";
  import "../../styles/index.scss";
  import Grid from "@/lib/components/Grid.svelte";

  // Init modules
  const wallpaperManager = new WallpaperManagerImpl();
</script>

<Grid>
  <div class="widgets-container">
    <!-- Widgets will go here -->
  </div>
</Grid>

<style lang="scss">
</style>

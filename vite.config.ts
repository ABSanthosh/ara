import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import webExtension from "vite-plugin-web-extension";
import autoprefixer from "autoprefixer";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    watch: {},
  },
  plugins: [svelte(), webExtension()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/styles/root/_mixins.scss";`,
      },
    },
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  resolve: {
    alias: {
      $stores: path.resolve("./src/stores"),
      $components: path.resolve("./src/components"),
      $lib: path.resolve("./src/lib"),
    },
  },
});

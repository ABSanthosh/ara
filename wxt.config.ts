import path from "path";
import { defineConfig } from "wxt";
import autoprefixer from "autoprefixer";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  vite: () => ({
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: `@use "src/styles/mixins.scss" as *;`,
        },
      },
      postcss: {
        plugins: [autoprefixer()],
      },
    },
    resolve: {
      alias: {
        // $stores: path.resolve("./src/utils/stores/*"),
      },
    },
  }),

  manifest: {
    name: "Unitab",
    description: "A simple new tab page",
    version: "1.0.0",
    manifest_version: 3,
    permissions: ["bookmarks", "storage", "tabs", "activeTab"],
    host_permissions: [
      "http://fonts.googleapis.com/*",
      "https://fonts.googleapis.com/*",
      "https://api.nasa.gov/*",
      "https://reddit.com/*",
      "https://www.reddit.com/*",
      "*://*/*",
    ],
    // content_security_policy: {
    //   extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://api.nasa.gov https://fonts.googleapis.com https://apod.nasa.gov https://reddit.com https://www.reddit.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
    // },
  },
});

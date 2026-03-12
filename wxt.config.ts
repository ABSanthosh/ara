import { defineConfig } from "wxt";
import autoprefixer from "autoprefixer";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  zip: {
    artifactTemplate: "ara-{{packageVersion}}.zip",
  },
  modules: ["@wxt-dev/module-svelte"],
  runner: {
    chromiumArgs: ["--new-window"],
    startUrls: ["chrome://newtab"],
  },
  vite: () => ({
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/mixins" as *;`,
        },
      },
      postcss: {
        plugins: [autoprefixer()],
      },
    },
  }),
  manifest: {
    name: process.env.NODE_ENV === "production" ? "ara" : "ara Dev",
    description: "A web experience",
    version: "1.0.0",
    manifest_version: 3,
    permissions: [
      "tabs",
      "alarms",
      "storage",
      "history",
      "bookmarks",
      "activeTab",
    ],
    host_permissions: ["<all_urls>"],
  },
});

import { defineConfig } from 'wxt';
import autoprefixer from 'autoprefixer';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/mixins" as *;`,
        },
      },
      postcss: {
        plugins: [autoprefixer()]
      }
    },
  }),
  manifest: {
    name: process.env.NODE_ENV === "production" ? "Ara" : "Ara Dev",
    description: "A web experience",
    version: "1.0.0",
    manifest_version: 3,
    permissions: ["bookmarks", "storage", "tabs", "activeTab", 'history'],
    host_permissions: ['<all_urls>']
  }
});

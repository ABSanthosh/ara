import { mount } from "svelte";
import App from "./App.svelte";
import { SettingStore } from "@/lib/modules/settings/settings.store";
import { CatStore } from "@/lib/modules/cats/cats.stores";
import { AppStateStore } from "@/lib/modules/settings/appState.store";

// Initialize all stores before mounting the app
async function initializeApp() {
  // Load all stores from storage in parallel
  await Promise.all([
    SettingStore.init(),
    CatStore.init(),
    AppStateStore.init(),
  ]);

  // Mount the app after stores are initialized
  const app = mount(App, {
    target: document.getElementById("app")!,
  });

  return app;
}

const app = await initializeApp();

export default app;
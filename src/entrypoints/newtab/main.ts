import { mount } from "svelte";
import App from "./App.svelte";
import { SettingStore } from "@/lib/modules/settings/settings.store";
import { CatStore } from "@/lib/modules/cats/cats.store";
import { AppStateStore } from "@/lib/modules/settings/appState.store";
import { PopupStore } from "@/lib/modules/popup/popup.store";

// Initialize all stores before mounting the app
async function initializeApp() {
  // Load all stores from storage in parallel
  await Promise.all([
    SettingStore.init(),
    AppStateStore.init(),
    CatStore.init(),
    PopupStore.init(),
  ]);

  // Mount the app after stores are initialized
  const app = mount(App, {
    target: document.getElementById("app")!,
  });

  return app;
}

const app = await initializeApp();

export default app;

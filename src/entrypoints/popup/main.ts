import { mount } from "svelte";
import Popup from "./Popup.svelte";

// Initialize all stores before mounting the app
async function initializeApp() {
  // Mount the app after stores are initialized
  const popup = mount(Popup, {
    target: document.getElementById("popup")!,
  });

  return popup;
}

const popup_app = await initializeApp();

export default popup_app;

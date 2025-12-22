import { mount } from "svelte";
import App from "./App.svelte";
import "../../styles/index.scss";

// Set wallpaper immediately from localStorage to prevent flash
try {
  const storedSettings = JSON.parse(
    localStorage.getItem("settingStore") || "{}"
  );
  const wallpaper =
    storedSettings?.options?.wallpaper?.url || "/assets/wallpapers/blobs-l.svg";
  document.documentElement.style.setProperty(
    "--initial-wallpaper",
    `url("${wallpaper}")`
  );
  document.body.style.backgroundImage = `url("${wallpaper}")`;
} catch (e) {
  document.body.style.backgroundImage = 'url("/assets/wallpapers/blobs-l.svg")';
}

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;

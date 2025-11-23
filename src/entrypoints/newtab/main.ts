import { mount } from "svelte";
import App from "./App.svelte";
import "../../styles/index.scss";
import hotkeys from "hotkeys-js";
import Spotlight from "@/lib/components/Spotlight.svelte";

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

// Mount Spotlight into the newtab page so Alt+Space works here too
try {
  const spotlightContainer = document.createElement("div");
  spotlightContainer.id = "unitab-spotlight-root";
  document.body.appendChild(spotlightContainer);

  // Mount the Spotlight component into our container
  mount(Spotlight, { target: spotlightContainer });

  hotkeys("alt+space", function (event) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("toggle-spotlight"));
  });
} catch (err) {
  // Fail silently - mounting Spotlight is optional for newtab
  console.warn("Failed to mount Spotlight in newtab:", err);
}

export default app;

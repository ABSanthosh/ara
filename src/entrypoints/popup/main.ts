import { mount } from "svelte";
import Popup from "./Popup.svelte";

async function initializePopup() {
  console.log("Initializing popup...");


  const popup_html = mount(Popup, {
    target: document.getElementById("popup")!,
  })
  return popup_html;
}

const popup = await initializePopup();

export default popup;
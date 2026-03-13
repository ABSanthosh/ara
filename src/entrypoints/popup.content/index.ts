import Popup from "./Popup.svelte";
import "../../styles/popup/index.scss";
import { mount, unmount } from "svelte";
import { ContentScriptContext } from "#imports";
import { PopupController } from "./utils/controller";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx: ContentScriptContext) {
    const ui = await createShadowRootUi(ctx, {
      anchor: "html",
      name: "popup-ui",
      position: "inline",
      onRemove: (container) => container && unmount(container),
      onMount: (container) => mount(Popup, { target: container }),
    });

    PopupController.setUi(ui).onMessage((message) => {
      if (message.type === "OPEN_POPUP") PopupController.open();
      if (message.type === "CLOSE_POPUP") PopupController.close();
    });
  },
});

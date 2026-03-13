import { BackgroundPopupManager } from "./popup.content/utils/background";

export default defineBackground(() => {
  BackgroundPopupManager.init();

  return () => {};
});

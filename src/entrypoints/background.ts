// entrypoints/background.ts

import { BackgroundPopupManager } from "./popup.content/utils/background";
// import { ActivityEngineImpl } from "@/lib/modules/activity/activity.engine";

export default defineBackground(() => {
  BackgroundPopupManager.init();
  // const activityEngine = new ActivityEngineImpl();

  return () => {
    // activityEngine.destroy();
  };
});

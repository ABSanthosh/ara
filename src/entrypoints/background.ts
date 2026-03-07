import { ActivityEngineImpl } from "@/lib/modules/activity/activity.engine";

export default defineBackground(() => {
  console.log("Background script initialized");
  // const ActivityEngine = new ActivityEngineImpl();

  return () => {
    // ActivityEngine.destroy();
  };
});

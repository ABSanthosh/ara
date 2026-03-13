import { TActivityStore } from "./activity.types";
import { StoreImpl } from "@/lib/utils/store";

const defaultStore: TActivityStore = {};

class ActivityStoreImpl extends StoreImpl<TActivityStore> {
  protected readonly storageKey = "activityStore";

  constructor() {
    super(defaultStore);
  }
}

export const ActivityStore = new ActivityStoreImpl();

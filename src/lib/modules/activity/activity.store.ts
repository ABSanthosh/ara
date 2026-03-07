import { Writable, writable } from "svelte/store";
import { TActivityStore } from "./activity.types";
import { storage } from "@/lib/utils/storage";

const defaultStore: TActivityStore = {};

class ActivityStoreImpl {
  public state = writable<TActivityStore>(defaultStore);
  private isInitialized = false;
  private unsubscribe: () => void = () => {};

  public subscribe: Writable<TActivityStore>["subscribe"] = (...args) =>
    this.state.subscribe(...args);
  public set: Writable<TActivityStore>["set"] = (...args) =>
    this.state.set(...args);
  public update: Writable<TActivityStore>["update"] = (...args) =>
    this.state.update(...args);

  constructor() {
    this.loadFromStorage();

    // Subscribe to changes and save to storage
    this.unsubscribe = this.state.subscribe((value) => {
      // Only save after initial load to avoid overwriting with defaults
      if (this.isInitialized) {
        this.saveToStorage(value);
      }
    });
  }

  private async loadFromStorage(): Promise<void> {
    const stored = await storage.getJSON<TActivityStore>("activityStore");

    if (stored) {
      this.state.set(stored);
    }

    this.isInitialized = true;
  }

  private async saveToStorage(value: TActivityStore): Promise<void> {
    await storage.setJSON("activityStore", value);
  }

  public destroy() {
    this.unsubscribe();
  }
}

export const ActivityStore = new ActivityStoreImpl();

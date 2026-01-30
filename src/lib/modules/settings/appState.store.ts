import { writable, type Writable } from "svelte/store";
import { storage } from "@/lib/utils/storage";

interface AppState {
  wallpaper: {
    isWallpaperLoading: boolean;
  };
}

const defaultAppState: AppState = {
  wallpaper: {
    isWallpaperLoading: false,
  },
};

class AppStateStoreImpl {
  public state = writable<AppState>(defaultAppState);
  private unsubscribe: () => void = () => {};
  private initPromise: Promise<void>;
  private isInitialized = false;

  public subscribe: Writable<AppState>["subscribe"] = (...args) =>
    this.state.subscribe(...args);
  public set: Writable<AppState>["set"] = (...args) => this.state.set(...args);
  public update: Writable<AppState>["update"] = (...args) =>
    this.state.update(...args);

  constructor() {
    // Initialize async loading
    this.initPromise = this.loadFromStorage();

    // Subscribe to changes and save to storage
    this.unsubscribe = this.state.subscribe((value) => {
      // Only save after initial load to avoid overwriting with defaults
      if (this.isInitialized) {
        this.saveToStorage(value);
      }
    });
  }

  /**
   * Wait for the store to finish loading from storage
   */
  public async init(): Promise<void> {
    return this.initPromise;
  }

  public destroy() {
    this.unsubscribe();
  }

  private async loadFromStorage(): Promise<void> {
    const stored = await storage.getJSON<AppState>("appState");

    if (stored) {
      this.state.set(stored);
    }

    this.isInitialized = true;
  }

  private async saveToStorage(value: AppState): Promise<void> {
    await storage.setJSON("appState", value);
  }
}

export const AppStateStore = new AppStateStoreImpl();

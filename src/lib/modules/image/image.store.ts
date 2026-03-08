import { ImageEngine, ImageResponse } from "./image.engine";
import { Magazine } from "@/lib/utils/magazine";
import { get, Writable, writable } from "svelte/store";
import { SettingStore } from "../settings/settings.store";
import { storage } from "@/lib/utils/storage";

type TWidgetImageState<T extends ImageResponse = ImageResponse> = {
  isPinned: boolean;
  favorites: T[];
  magazine: T[];
  timesAccessed: number;
  lastRefreshed?: number; // Timestamp of last refresh
};

type TImageStore = {
  widgets: Record<string, TWidgetImageState>; // Per-widget storage
};

const defaultWidgetState: TWidgetImageState = {
  magazine: [],
  favorites: [],
  isPinned: false,
  timesAccessed: 0,
  lastRefreshed: undefined,
};

const defaultStore: TImageStore = {
  widgets: {},
};

class ImageStoreImpl {
  public images = writable<TImageStore>(defaultStore);
  public magazines: Map<string, Magazine<ImageResponse>> = new Map();
  private unsubscribe: () => void = () => {};
  private settingsUnsubscribes: Map<string, () => void> = new Map();
  private initPromise: Promise<void>;
  private isInitialized = false;

  public subscribe: Writable<TImageStore>["subscribe"] = (...args) =>
    this.images.subscribe(...args);
  public set: Writable<TImageStore>["set"] = (...args) => this.images.set(...args);
  public update: Writable<TImageStore>["update"] = (...args) =>
    this.images.update(...args);

  constructor() {
    // Initialize async loading
    this.initPromise = this.loadFromStorage();

    // Subscribe to changes and save to storage
    this.unsubscribe = this.images.subscribe((value) => {
      // Only save after initial load to avoid overwriting with defaults
      if (this.isInitialized) {
        this.saveToStorage(value);
      }
    });

    // Clean up orphaned widget data (widgets that exist in ImageStore but not in SettingStore)
    // This prevents memory leaks from deleted widgets
    const cleanupOrphans = () => {
      const settings = get(SettingStore);
      const imageStoreState = get(this.images);
      
      Object.keys(imageStoreState.widgets).forEach((widgetId) => {
        if (!settings.widgets[widgetId]) {
          // Widget was deleted but its data remains in ImageStore
          this.removeMagazine(widgetId);
        }
      });
    };

    // Run cleanup on initialization and when settings change
    cleanupOrphans();
    SettingStore.subscribe(cleanupOrphans);
  }

  /**
   * Check if widget needs refresh based on refresh interval setting
   * @param widgetId - Widget identifier
   * @param refreshInterval - Refresh interval setting
   * @returns true if refresh is needed
   */
  private shouldRefresh(
    widgetId: string,
    refreshInterval: "newTab" | "24 hr" | "10 min" | "30 min" = "10 min"
  ): boolean {
    const widgetStore = get(this.images).widgets[widgetId];
    if (!widgetStore || !widgetStore.lastRefreshed) {
      return true; // First time, needs refresh
    }

    const now = Date.now();
    const lastRefreshed = widgetStore.lastRefreshed;
    const elapsed = now - lastRefreshed;

    switch (refreshInterval) {
      case "newTab":
        return true; // Always refresh on new tab
      case "24 hr":
        return elapsed >= 24 * 60 * 60 * 1000; // 24 hours
      case "30 min":
        return elapsed >= 30 * 60 * 1000; // 30 minutes
      case "10 min":
      default:
        return elapsed >= 10 * 60 * 1000; // 10 minutes
    }
  }

  /**
   * Mark widget as refreshed
   * @param widgetId - Widget identifier
   */
  private markAsRefreshed(widgetId: string) {
    this.images.update((store) => {
      if (store.widgets[widgetId]) {
        store.widgets[widgetId].lastRefreshed = Date.now();
      }
      return store;
    });
  }

  /**
   * Initialize a magazine for a specific widget
   * @param widgetId - Unique widget identifier
   * @param settings - Magazine configuration
   * @param engine - ImageEngine instance to fetch new images
   * @param fetchParams - Parameters to pass to the engine's getRandom method
   */
  public initMagazine<T extends ImageResponse = ImageResponse>(
    widgetId: string,
    settings: { magazineSize: number; maxAccess: number; refreshInterval?: "newTab" | "24 hr" | "10 min" | "30 min" },
    engine: ImageEngine<T>,
    fetchParams?: { tag?: string; options?: unknown }
  ) {
    // If magazine already exists, don't reinitialize
    if (this.magazines.has(widgetId)) {
      // Update settings if they changed
      const magazine = this.magazines.get(widgetId);
      if (magazine) {
        magazine.updateMaxAccess(settings.maxAccess);
      }
      
      // Check if refresh is needed based on interval
      const refreshInterval = settings.refreshInterval || "10 min";
      if (this.shouldRefresh(widgetId, refreshInterval)) {
        // Clear magazine and mark for refresh
        magazine?.clearMagazine();
        this.markAsRefreshed(widgetId);
      }
      
      return;
    }

    // Ensure widget store exists
    this.images.update((store) => {
      if (!store.widgets[widgetId]) {
        store.widgets[widgetId] = { ...defaultWidgetState };
      }
      return store;
    });

    const widgetStore = get(this.images).widgets[widgetId];
    
    // Check if we need to refresh based on interval
    const refreshInterval = settings.refreshInterval || "10 min";
    const needsRefresh = this.shouldRefresh(widgetId, refreshInterval);
    
    // If refresh is needed, clear existing magazine data
    const preloadMagazine = needsRefresh ? [] : widgetStore.magazine;
    const preloadTimesAccessed = needsRefresh ? 0 : widgetStore.timesAccessed;
    
    // Mark as refreshed if we're starting fresh
    if (needsRefresh) {
      this.markAsRefreshed(widgetId);
    }

    const magazine = new Magazine<ImageResponse>({
      size: settings.magazineSize,
      maxAccess: settings.maxAccess,
      preload: preloadMagazine,
      preloadTimesAccessed: preloadTimesAccessed,
      fetchNewItem: async (count) => {
        const tag = fetchParams?.tag || "";
        const options = fetchParams?.options;
        return engine.getRandom(tag, count, options);
      },
      onItemsChange: (items: ImageResponse[]) => {
        this.images.update((imgs) => {
          if (!imgs.widgets[widgetId]) imgs.widgets[widgetId] = { ...defaultWidgetState };
          imgs.widgets[widgetId].magazine = items;
          return imgs;
        });
      },
      onTimesAccessedChange: (timesAccessed: number) => {
        this.images.update((imgs) => {
          if (!imgs.widgets[widgetId]) imgs.widgets[widgetId] = { ...defaultWidgetState };
          imgs.widgets[widgetId].timesAccessed = timesAccessed;
          return imgs;
        });
      },
    });

    this.magazines.set(widgetId, magazine);

    // Subscribe to settings changes for this widget
    const unsubscribe = SettingStore.subscribe((settings) => {
      const widget = settings.widgets[widgetId];
      if (widget && "settings" in widget && "maxAccess" in widget.settings && magazine) {
        const maxAccess = (widget.settings as any).maxAccess;
        if (typeof maxAccess === "number") {
          magazine.updateMaxAccess(maxAccess);
        }
      }
    });

    this.settingsUnsubscribes.set(widgetId, unsubscribe);
  }

  /**
   * Get magazine for a specific widget
   */
  public getMagazine(widgetId: string): Magazine<ImageResponse> | undefined {
    return this.magazines.get(widgetId);
  }

  /**
   * Remove magazine for a widget (cleanup when widget is deleted)
   */
  public removeMagazine(widgetId: string) {
    this.magazines.delete(widgetId);
    
    // Clean up settings subscription
    const unsubscribe = this.settingsUnsubscribes.get(widgetId);
    if (unsubscribe) {
      unsubscribe();
      this.settingsUnsubscribes.delete(widgetId);
    }

    // Remove from store
    this.images.update((store) => {
      delete store.widgets[widgetId];
      return store;
    });
  }

  /**
   * Add an image to favorites for a specific widget
   */
  public addToFavorites<T extends ImageResponse = ImageResponse>(
    widgetId: string,
    image: T
  ) {
    this.images.update((store) => {
      if (!store.widgets[widgetId]) {
        store.widgets[widgetId] = { ...defaultWidgetState };
      }
      const favorites = store.widgets[widgetId].favorites as T[];
      if (!favorites.some((fav) => fav.id === image.id)) {
        favorites.push(image);
      }
      return store;
    });
  }

  /**
   * Remove an image from favorites for a specific widget
   */
  public removeFromFavorites(widgetId: string, imageId: string) {
    this.images.update((store) => {
      if (store.widgets[widgetId]) {
        store.widgets[widgetId].favorites = store.widgets[widgetId].favorites.filter(
          (fav) => fav.id !== imageId
        );
      }
      return store;
    });
  }

  /**
   * Check if an image is favorited for a specific widget
   */
  public isFavorited(widgetId: string, imageId: string): boolean {
    const state = get(this.images);
    return state.widgets[widgetId]?.favorites.some((fav) => fav.id === imageId) ?? false;
  }

  /**
   * Wait for the store to finish loading from storage
   */
  public async init(): Promise<void> {
    return this.initPromise;
  }

  public destroy() {
    this.unsubscribe();
    this.settingsUnsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  private async loadFromStorage(): Promise<void> {
    const stored = await storage.getJSON<TImageStore>("imageStore");

    if (stored) {
      this.images.set(stored);
    }

    this.isInitialized = true;
  }

  private async saveToStorage(value: TImageStore): Promise<void> {
    await storage.setJSON("imageStore", value);
  }
}

export const ImageStore = new ImageStoreImpl();

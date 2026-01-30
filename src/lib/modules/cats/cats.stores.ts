import { CatEngine } from "./cats.engine";
import { Magazine } from "@/lib/utils/magazine";
import { get, Writable, writable } from "svelte/store";
import { SettingStore } from "../settings/settings.store";
import { storage } from "@/lib/utils/storage";

export type TCatItem = {
  title: string;
  postUrl: string;
  imageUrl: string;
  subreddit: string;
  source: string;
};

type TWidgetCatState = {
  isPinned: boolean;
  favorites: TCatItem[];
  magazine: TCatItem[];
  timesAccessed: number;
};

type TCatStore = {
  widgets: Record<string, TWidgetCatState>; // Per-widget storage
};

const defaultWidgetState: TWidgetCatState = {
  magazine: [],
  favorites: [],
  isPinned: false,
  timesAccessed: 0,
};

const defaultStore: TCatStore = {
  widgets: {},
};

class CatStoreImpl {
  public cats = writable<TCatStore>(defaultStore);
  public magazines: Map<string, Magazine<TCatItem>> = new Map();
  private unsubscribe: () => void = () => {};
  private settingsUnsubscribes: Map<string, () => void> = new Map();
  private initPromise: Promise<void>;
  private isInitialized = false;

  public subscribe: Writable<TCatStore>["subscribe"] = (...args) =>
    this.cats.subscribe(...args);
  public set: Writable<TCatStore>["set"] = (...args) => this.cats.set(...args);
  public update: Writable<TCatStore>["update"] = (...args) =>
    this.cats.update(...args);

  constructor() {
    // Initialize async loading
    this.initPromise = this.loadFromStorage();

    // Subscribe to changes and save to storage
    this.unsubscribe = this.cats.subscribe((value) => {
      // Only save after initial load to avoid overwriting with defaults
      if (this.isInitialized) {
        this.saveToStorage(value);
      }
    });

    // Clean up orphaned widget data (widgets that exist in CatStore but not in SettingStore)
    // This prevents memory leaks from deleted widgets
    const cleanupOrphans = () => {
      const settings = get(SettingStore);
      const catStoreState = get(this.cats);
      
      Object.keys(catStoreState.widgets).forEach((widgetId) => {
        if (!settings.widgets[widgetId]) {
          // Widget was deleted but its data remains in CatStore
          this.removeMagazine(widgetId);
        }
      });
    };

    // Run cleanup on initialization and when settings change
    cleanupOrphans();
    SettingStore.subscribe(cleanupOrphans);
  }

  /**
   * Initialize a magazine for a specific widget
   */
  public initMagazine(widgetId: string, settings: { magazineSize: number; maxAccess: number }) {
    // If magazine already exists, don't reinitialize
    if (this.magazines.has(widgetId)) {
      // Update settings if they changed
      const magazine = this.magazines.get(widgetId);
      if (magazine) {
        magazine.updateMaxAccess(settings.maxAccess);
      }
      return;
    }

    // Ensure widget store exists
    this.cats.update((store) => {
      if (!store.widgets[widgetId]) {
        store.widgets[widgetId] = { ...defaultWidgetState };
      }
      return store;
    });

    const widgetStore = get(this.cats).widgets[widgetId];

    const magazine = new Magazine<TCatItem>({
      size: settings.magazineSize,
      maxAccess: settings.maxAccess,
      preload: widgetStore.magazine,
      preloadTimesAccessed: widgetStore.timesAccessed,
      fetchNewItem: async (count) => CatEngine.getNRandomCats(count),
      onItemsChange: (items: TCatItem[]) => {
        this.cats.update((cats) => {
          if (!cats.widgets[widgetId]) cats.widgets[widgetId] = { ...defaultWidgetState };
          cats.widgets[widgetId].magazine = items;
          return cats;
        });
      },
      onTimesAccessedChange: (timesAccessed: number) => {
        this.cats.update((cats) => {
          if (!cats.widgets[widgetId]) cats.widgets[widgetId] = { ...defaultWidgetState };
          cats.widgets[widgetId].timesAccessed = timesAccessed;
          return cats;
        });
      },
    });

    this.magazines.set(widgetId, magazine);

    // Subscribe to settings changes for this widget
    const unsubscribe = SettingStore.subscribe((settings) => {
      const widget = settings.widgets[widgetId];
      if (widget && widget.type === "cat" && magazine) {
        magazine.updateMaxAccess(widget.settings.maxAccess ?? 1);
      }
    });

    this.settingsUnsubscribes.set(widgetId, unsubscribe);
  }

  /**
   * Get magazine for a specific widget
   */
  public getMagazine(widgetId: string): Magazine<TCatItem> | undefined {
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
    this.cats.update((store) => {
      delete store.widgets[widgetId];
      return store;
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
    this.settingsUnsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  private async loadFromStorage(): Promise<void> {
    const stored = await storage.getJSON<TCatStore>("catStore");

    if (stored) {
      this.cats.set(stored);
    }

    this.isInitialized = true;
  }

  private async saveToStorage(value: TCatStore): Promise<void> {
    await storage.setJSON("catStore", value);
  }
}

export const CatStore = new CatStoreImpl();

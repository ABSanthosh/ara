import { writable } from "svelte/store";
import type { Unsubscriber, Writable } from "svelte/store";
import { SettingsTabs, TSettingStore } from "./settings.types";

const defaultStore: TSettingStore = {
  internal: {
    grid: {
      rows: -1,
      cols: -1,
      cellSize: -1,
      gap: -1,
      occupiedCells: new Set<string>(),
    },
    settings: {
      lastVisitedTab: SettingsTabs.GENERAL,
      widgetPane: {
        filterCache: {},
      },
    },
    widgetDefaults: {
      CatWidget: {
        magazineSize: 7,
        maxAccess: 1,
        refreshInterval: "10 min",
        subreddit: [
          "catpics",
          "CatsInHats",
          "catpictures",
          "catsinboxes",
          "Catswithjobs",
          "CatsInBusinessAttire",
        ],
      },
    },
  },
  options: {
    showGrid: false,
    isDraggable: false,
    isResizable: false,
  },
  widgets: {},
  wallpaper: {
    activePlugin: "preset",
    url: "/assets/wallpapers/fold-d.jpg",
    plugins: {
      nasa: {
        favorites: [],
        category: "apod",
        mode: "dynamic",
        lastUpdate: new Date(new Date().setHours(0, 0, 0, 0)),
        nasaAPIKey: import.meta.env.PROD
          ? ""
          : "44z7IfTy6ctYbetZz0AasrBId43RQdcey4iwhrdX",
        metadata: null,
      },
      aic: {
        metadata: null,
      },
      nga: {
        metadata: null,
      },
      presets: [
        "/assets/wallpapers/adwaita-d.jpg",
        "/assets/wallpapers/adwaita-l.jpg",
        "/assets/wallpapers/blobs-d.svg",
        "/assets/wallpapers/blobs-l.svg",
        "/assets/wallpapers/drool-d.svg",
        "/assets/wallpapers/drool-l.svg",
        "/assets/wallpapers/fold-d.jpg",
        "/assets/wallpapers/fold-l.jpg",
        "/assets/wallpapers/ventura-d.jpg",
      ],
    },
  },
};

class SettingStoreImpl {
  public set!: Writable<TSettingStore>["set"];
  public update!: Writable<TSettingStore>["update"];
  public subscribe!: Writable<TSettingStore>["subscribe"];
  public unsubscribe!: Unsubscriber;

  private isInitialized = false;

  private saveTimer: NodeJS.Timeout | null = null;
  private DEBOUNCE_DELAY = 2000; // 2 second debounce for saving to storage

  private settingsItem = storage.defineItem<TSettingStore>("local:settings", {
    version: 1,
    fallback: defaultStore,
  });

  constructor() {
    const { subscribe, set, update } = writable<TSettingStore>(defaultStore);
    this.set = set;
    this.update = update;
    this.subscribe = subscribe;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // initial load
    this.settingsItem.getValue().then((value) => {
      this.set(
        this.normalizeSettings(this.deserialize(value) as TSettingStore),
      );
    });

    // react to external storage updates
    this.unsubscribe = this.settingsItem.watch((value) => {
      this.set(this.deserialize(value) as TSettingStore);
    });

    // save to storage on changes
    this.subscribe((value) => {
      if (this.saveTimer !== null) {
        clearTimeout(this.saveTimer);
      }

      this.saveTimer = setTimeout(() => {
        this.settingsItem.setValue(this.serialize(value));
      }, this.DEBOUNCE_DELAY);
    });

    this.isInitialized = true;
  }

  public destroy() {
    this.unsubscribe();
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
    }
  }

  /**
   * Updates the occupiedCells Set in the grid based on all current widgets.
   * Optionally excludes a specific widget ID (useful during drag/resize operations).
   */
  public updateOccupiedCells(excludeWidgetId?: string) {
    this.update((state) => {
      // Ensure occupiedCells is a Set (defensive programming)
      if (!(state.internal.grid.occupiedCells instanceof Set)) {
        state.internal.grid.occupiedCells = new Set<string>();
      }

      state.internal.grid.occupiedCells.clear();

      Object.values(state.widgets).forEach((w) => {
        if (excludeWidgetId && w.id === excludeWidgetId) return;

        for (let r = w.pos.row; r < w.pos.row + w.span.y; r++) {
          for (let c = w.pos.col; c < w.pos.col + w.span.x; c++) {
            state.internal.grid.occupiedCells.add(`${r}-${c}`);
          }
        }
      });

      return state;
    });
  }

  private normalizeSettings(value: TSettingStore): TSettingStore {
    return {
      ...value,
      options: {
        ...value.options,
        isDraggable: false,
        isResizable: false,
        showGrid: false,
      },
    };
  }

  private isSerializable(value: any): boolean {
    // Skip DOM elements
    if (value instanceof Element || value instanceof HTMLElement) {
      return false;
    }

    // Skip functions
    if (typeof value === "function") {
      return false;
    }

    // Allow null, primitives, objects, arrays
    return true;
  }

  private serialize(value: any): any {
    // possible times for now: Date, Set
    if (value instanceof Date) {
      return {
        __type: "Date",
        __value: value.toISOString(),
      };
    }

    // Convert Set to array with type marker
    if (value instanceof Set) {
      return {
        __type: "Set",
        __value: Array.from(value),
      };
    }

    if (!this.isSerializable(value)) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.serialize(item))
        .filter((item) => item !== undefined);
    }

    if (value && typeof value === "object") {
      const output: Record<string, any> = {};

      Object.entries(value).forEach(([key, nestedValue]) => {
        const serializedValue = this.serialize(nestedValue);
        if (serializedValue !== undefined) {
          output[key] = serializedValue;
        }
      });

      return output;
    }

    return value;
  }

  private deserialize(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.deserialize(item));
    }

    if (value && typeof value === "object") {
      // Restore Date from ISO string
      if (value.__type === "Date") {
        return new Date(value.__value);
      }

      // Restore Set from array
      if (value.__type === "Set") {
        return new Set(value.__value);
      }

      const output: Record<string, any> = {};
      Object.entries(value).forEach(([key, nestedValue]) => {
        output[key] = this.deserialize(nestedValue);
      });

      return output;
    }

    return value;
  }
}

export const SettingStore = new SettingStoreImpl();

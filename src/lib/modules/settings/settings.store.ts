import { Widgets } from "../widgets/widgets.types";
import { SettingsTabs, TSettingStore } from "./settings.types";
import { writable, type Writable } from "svelte/store";
import { storage } from "@/lib/utils/storage";

const defaultStore: TSettingStore = {
  internal: {
    grid: {
      rows: -1,
      cols: -1,
      cellSize: -1,
      gap: -1,
      element: document.createElement("div"),
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
        nasaAPIKey: "44z7IfTy6ctYbetZz0AasrBId43RQdcey4iwhrdX",
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
  public state = writable<TSettingStore>(defaultStore);
  private saveTimer: NodeJS.Timeout | null = null;
  private unsubscribe: () => void = () => {};
  private initPromise: Promise<void>;
  private isInitialized = false;

  public subscribe: Writable<TSettingStore>["subscribe"] = (...args) =>
    this.state.subscribe(...args);
  public set: Writable<TSettingStore>["set"] = (...args) =>
    this.state.set(...args);
  public update: Writable<TSettingStore>["update"] = (...args) =>
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

  private async loadFromStorage(): Promise<void> {
    const stored = await storage.getJSON<any>("settingStore");

    if (stored) {
      // On every load, we reset these flags to false
      stored.options.isDraggable = false;
      stored.options.isResizable = false;
      stored.options.showGrid = false;

      // Reconstruct non-serializable properties
      // occupiedCells is runtime state, always initialize as empty Set
      stored.internal.grid.occupiedCells = new Set<string>();
      // element is runtime state, initialize with dummy element
      stored.internal.grid.element = document.createElement("div");

      this.state.set(stored as TSettingStore);
    }

    this.isInitialized = true;
  }

  private async saveToStorage(value: TSettingStore): Promise<void> {
    // Create a serializable copy by excluding non-serializable properties
    const serializable = {
      ...value,
      internal: {
        ...value.internal,
        grid: {
          rows: value.internal.grid.rows,
          cols: value.internal.grid.cols,
          cellSize: value.internal.grid.cellSize,
          gap: value.internal.grid.gap,
          // Exclude occupiedCells (Set) and element (DOM node) - these are runtime state
        },
      },
    };

    await storage.setJSON("settingStore", serializable);
  }
}

export const SettingStore = new SettingStoreImpl();

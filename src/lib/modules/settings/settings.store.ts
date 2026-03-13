import { StoreImpl } from "@/lib/utils/store";
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

class SettingStoreImpl extends StoreImpl<TSettingStore> {
  protected readonly storageKey = "settings";

  constructor() {
    super(defaultStore); // ← defaultStore passed here, available immediately
  }

  protected override normalize(value: TSettingStore): TSettingStore {
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

  public updateOccupiedCells(excludeWidgetId?: string) {
    this.update((state) => {
      if (!(state.internal.grid.occupiedCells instanceof Set)) {
        state.internal.grid.occupiedCells = new Set<string>();
      }
      state.internal.grid.occupiedCells.clear();

      Object.values(state.widgets).forEach((w) => {
        if (excludeWidgetId && w.id === excludeWidgetId) return;
        for (let r = w.pos.row; r < w.pos.row + w.span.y; r++)
          for (let c = w.pos.col; c < w.pos.col + w.span.x; c++)
            state.internal.grid.occupiedCells.add(`${r}-${c}`);
      });

      return state;
    });
  }
}

export const SettingStore = new SettingStoreImpl();

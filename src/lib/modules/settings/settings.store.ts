import { writable, type Writable } from "svelte/store";
import { TSettingStore } from "./settings.types";

const defaultStore: TSettingStore = {
  internal: {
    grid: {
      rows: -1,
      cols: -1,
      cellSize: -1,
      gap: -1,
      element: document.createElement("div"),
    },
  },
  options: {
    showGrid: false,
    isDraggable: true,
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
        nasaAPIKey: "DEMO_KEY",
        metadata: {},
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
  public state = writable<TSettingStore>(this.loadFromLocalStorage());
  private saveTimer: NodeJS.Timeout | null = null;
  private unsubscribe: () => void = () => {};

  public subscribe: Writable<TSettingStore>["subscribe"] = (...args) =>
    this.state.subscribe(...args);
  public set: Writable<TSettingStore>["set"] = (...args) =>
    this.state.set(...args);
  public update: Writable<TSettingStore>["update"] = (...args) =>
    this.state.update(...args);

  constructor() {
    this.unsubscribe = this.state.subscribe((value) => {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
      }
      this.saveTimer = setTimeout(() => {
        window.localStorage.setItem("settingStore", JSON.stringify(value));
      }, 1000);
    });
  }

  public destroy() {
    this.unsubscribe();
  }

  private loadFromLocalStorage(): TSettingStore {
    const stored = window.localStorage.getItem("settingStore");
    return stored ? JSON.parse(stored) : defaultStore;
  }
}

export const SettingStore = new SettingStoreImpl();

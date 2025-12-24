import { writable, type Writable } from "svelte/store";
import { TSettingStore } from "./settings.types";

const defaultStore: TSettingStore = {
  options: {
    showGrid: false,
    isDraggable: false,
    isResizable: false,
  },
  wallpaper: {
    activePlugin: "preset",
    url: "/assets/wallpapers/adwaita-d.jpg",
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
    }
  },
};

class SettingStoreImpl {
  private state = writable<TSettingStore>(this.loadFromLocalStorage());
  private saveTimer: NodeJS.Timeout | null = null;

  get stateValue(): Writable<TSettingStore> {
    return this.state
  }

  public update: Writable<TSettingStore>["update"] = (...args) => this.state.update(...args);

  constructor() {
    this.state.subscribe((value) => {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
      }
      this.saveTimer = setTimeout(() => {
        window.localStorage.setItem("settingStore", JSON.stringify(value));
      }, 1000);
    })
  }

  private loadFromLocalStorage(): TSettingStore {
    const stored = window.localStorage.getItem("settingStore");
    return stored ? JSON.parse(stored) : defaultStore;
  }
}

export const SettingStore = new SettingStoreImpl();

import { get } from "svelte/store";
import { SettingStore } from "../settings/settings.store";
import { NASAEngineImpl } from "../image/engines/nasa/nasa.engine";
import { AppStateStore } from "../settings/appState.store";

/**
 * This is the class that manages different types of wallpapers.
 * For now, there are 2 types: preset and NASA APOD.
 * Wallpaper manager will take different
 */
export class WallpaperManagerImpl {
  private unsubscribe: () => void;
  private _nasaEngine = new NASAEngineImpl("DEMO_KEY");

  constructor() {
    this.unsubscribe = SettingStore.subscribe((settings) => {
      document.body.style.backgroundImage = `url(${settings.wallpaper.url})`;
    });

    // Load NASA API key from settings store if available
    const savedApiKey =
      get(SettingStore).wallpaper.plugins.nasa.nasaAPIKey || "DEMO_KEY";
    this._nasaEngine = new NASAEngineImpl(savedApiKey);

    // Check if dynamic APOD wallpaper needs daily update
    this.checkDailyUpdate();
  }

  get NASAEngine() {
    return this._nasaEngine;
  }

  /**
   * Clean up subscriptions. Call this when destroying the instance.
   */
  public destroy() {
    this.unsubscribe();
  }

  /**
   * Update wallpaper type. Possible types are "preset" and "nasa".
   * Under nasa, category is only "apod" for now and types are "dynamic" and "static".
   * If dynamic, wallpaper updates daily to latest APOD.
   * If static, wallpaper is fixed to a specific date so it also takes a date parameter.
   * @param type Wallpaper type
   * @param options Additional options for wallpaper type
   */
  public async setWallpaper({
    type,
    options,
  }:
    | {
        type: "preset";
        options: { url: string };
      }
    | {
        type: "nasa";
        options:
          | {
              mode: "dynamic";
              category: "apod";
            }
          | {
              mode: "static";
              category: "apod";
              date: Date;
            };
      }) {
    if (type === "preset") {
      const presetUrl = options.url;
      SettingStore.update((state) => {
        state.wallpaper.activePlugin = "preset";
        state.wallpaper.url = presetUrl;
        return state;
      });
    } else if (type === "nasa") {
      if (options.mode === "dynamic") {
        // Don't specify a date - let NASA API return the latest available APOD
        const results = await this._nasaEngine.search("", 1, {});
        const wallpaper = results[0];
        SettingStore.update((state) => {
          state.wallpaper.activePlugin = "nasa";

          // if the hdurl exists, use that else use url
          state.wallpaper.url = wallpaper.imageUrl || "";
          state.wallpaper.plugins.nasa.metadata = wallpaper.raw;
          state.wallpaper.plugins.nasa.mode = "dynamic";
          state.wallpaper.plugins.nasa.category = "apod";
          state.wallpaper.plugins.nasa.lastUpdate = new Date(
            new Date().setHours(0, 0, 0, 0),
          );

          return state;
        });
      } else if (options.mode === "static") {
        const dateStr = options.date.toISOString().split("T")[0];
        const results = await this._nasaEngine.search("", 1, { date: dateStr });
        const wallpaper = results[0];
        SettingStore.update((state) => {
          state.wallpaper.activePlugin = "nasa";
          state.wallpaper.url = wallpaper.imageUrl || "";
          state.wallpaper.plugins.nasa.metadata = wallpaper.raw;
          state.wallpaper.plugins.nasa.mode = "static";
          state.wallpaper.plugins.nasa.category = "apod";
          state.wallpaper.plugins.nasa.staticDate = options.date;

          return state;
        });
      }
    }
  }

  /**
   * Get wallpaper data
   */
  public getWallpaper() {
    const settings = get(SettingStore);
    //  if type is preset return url else return nasa metadata
    if (settings.wallpaper.activePlugin === "preset") {
      return {
        type: "preset" as const,
        url: settings.wallpaper.url,
      };
    } else if (settings.wallpaper.activePlugin === "nasa") {
      return {
        type: "nasa" as const,
        metadata: settings.wallpaper.plugins.nasa,
      };
    }
  }

  /**
   * Refresh nasa wallpaper if the active plugin is nasa and mode is dynamic
   */
  public async refreshNASA() {
    const settings = get(SettingStore);
    if (settings.wallpaper.activePlugin === "nasa") {
      AppStateStore.update((state) => {
        state.wallpaper.isWallpaperLoading = true;
        return state;
      });

      const results = await this._nasaEngine.getRandom("", 1);
      const wallpaper = results[0];
      SettingStore.update((state) => {
        state.wallpaper.url = wallpaper.imageUrl || "";
        state.wallpaper.plugins.nasa.metadata = wallpaper.raw;
        
        // When refreshing, always set to dynamic mode and clear static date
        state.wallpaper.plugins.nasa.mode = "dynamic";
        delete state.wallpaper.plugins.nasa.staticDate;
        state.wallpaper.plugins.nasa.lastUpdate = new Date(
          new Date().setHours(0, 0, 0, 0),
        );

        return state;
      });

      AppStateStore.update((state) => {
        state.wallpaper.isWallpaperLoading = false;
        return state;
      });
    }
  }

  /**
   * Check if the APOD wallpaper needs to be updated (for dynamic mode)
   * Updates the wallpaper if it's a new day since the last update
   */
  private async checkDailyUpdate() {
    const settings = get(SettingStore);

    // Only check if NASA APOD is active and in dynamic mode
    if (
      settings.wallpaper.activePlugin !== "nasa" ||
      settings.wallpaper.plugins.nasa.mode !== "dynamic"
    ) {
      return;
    }

    const lastUpdate = settings.wallpaper.plugins.nasa.lastUpdate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if lastUpdate exists and if it's a different day
    if (!lastUpdate || new Date(lastUpdate).getTime() !== today.getTime()) {
      try {
        // Fetch the latest APOD - don't specify date to avoid future date issues
        const results = await this._nasaEngine.search("", 1, {});
        const wallpaper = results[0];

        SettingStore.update((state) => {
          state.wallpaper.url = wallpaper.imageUrl || "";
          state.wallpaper.plugins.nasa.metadata = wallpaper.raw;
          state.wallpaper.plugins.nasa.lastUpdate = today;
          return state;
        });
      } catch (error) {
        console.error("Failed to update daily APOD:", error);
      }
    }
  }
}

export const WallpaperManager = new WallpaperManagerImpl();

import { get } from "svelte/store";
import { SettingStore } from "../settings/settings.store";
import { NASAEngineImpl } from "../image/engines/nasa/nasa.engine";
import { AICEngineImpl } from "../image/engines/aic.engine";
import { GettyEngineImpl } from "../image/engines/getty.engine";
import { MauritshuisEngineImpl } from "../image/engines/mauritshuis.engine";
import { NGAEngineImpl } from "../image/engines/nga.engine";
import { RijksEngineImpl } from "../image/engines/rijks.engine";
import { AppStateStore } from "../settings/appState.store";

/**
 * This is the class that manages different types of wallpapers.
 * For now, there are 2 types: preset and NASA APOD.
 * Wallpaper manager will take different
 */
export class WallpaperManagerImpl {
  private unsubscribe: () => void;
  private _nasaEngine = new NASAEngineImpl("DEMO_KEY");
  private _aicEngine = new AICEngineImpl();
  private _gettyEngine = new GettyEngineImpl();
  private _mauritshuisEngine = new MauritshuisEngineImpl();
  private _ngaEngine = new NGAEngineImpl();
  private _rijksEngine = new RijksEngineImpl("");

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

  get AICEngine() {
    return this._aicEngine;
  }

  get GettyEngine() {
    return this._gettyEngine;
  }

  get MauritshuisEngine() {
    return this._mauritshuisEngine;
  }

  get NGAEngine() {
    return this._ngaEngine;
  }

  get RijksEngine() {
    return this._rijksEngine;
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
      }
    | {
        type: "aic" | "getty" | "mauritshuis" | "nga" | "rijksmuseum";
        options: { searchTag: string };
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
    } else if (
      type === "aic" ||
      type === "getty" ||
      type === "mauritshuis" ||
      type === "nga" ||
      type === "rijksmuseum"
    ) {
      let engine;
      switch (type) {
        case "aic":
          engine = this._aicEngine;
          break;
        case "getty":
          engine = this._gettyEngine;
          break;
        case "mauritshuis":
          engine = this._mauritshuisEngine;
          break;
        case "nga":
          engine = this._ngaEngine;
          break;
        case "rijksmuseum":
          engine = this._rijksEngine;
          break;
      }

      const results = await engine.getRandom(options.searchTag, 1);
      if (results.length > 0) {
        const wallpaper = results[0];
        SettingStore.update((state) => {
          state.wallpaper.activePlugin = type;
          state.wallpaper.url = wallpaper.imageUrl || "";
          state.wallpaper.plugins[type].metadata = wallpaper;
          state.wallpaper.plugins[type].lastSearch = options.searchTag;
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
   * Refresh the current wallpaper by fetching a new random image from the active engine
   */
  public async refresh() {
    const settings = get(SettingStore);
    const activePlugin = settings.wallpaper.activePlugin;

    // Don't refresh preset wallpapers
    if (activePlugin === "preset") {
      return;
    }

    AppStateStore.update((state) => {
      state.wallpaper.isWallpaperLoading = true;
      return state;
    });

    try {
      if (activePlugin === "nasa") {
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
      } else if (
        activePlugin === "aic" ||
        activePlugin === "getty" ||
        activePlugin === "mauritshuis" ||
        activePlugin === "nga" ||
        activePlugin === "rijksmuseum"
      ) {
        let engine;
        switch (activePlugin) {
          case "aic":
            engine = this._aicEngine;
            break;
          case "getty":
            engine = this._gettyEngine;
            break;
          case "mauritshuis":
            engine = this._mauritshuisEngine;
            break;
          case "nga":
            engine = this._ngaEngine;
            break;
          case "rijksmuseum":
            engine = this._rijksEngine;
            break;
        }

        // Use the last search tag or a default one
        const searchTag = settings.wallpaper.plugins[activePlugin].lastSearch || "art";
        const results = await engine.getRandom(searchTag, 1);
        
        if (results.length > 0) {
          const wallpaper = results[0];
          SettingStore.update((state) => {
            state.wallpaper.url = wallpaper.imageUrl || "";
            state.wallpaper.plugins[activePlugin].metadata = wallpaper;
            return state;
          });
        }
      }
    } catch (error) {
      console.error(`Failed to refresh ${activePlugin} wallpaper:`, error);
    } finally {
      AppStateStore.update((state) => {
        state.wallpaper.isWallpaperLoading = false;
        return state;
      });
    }
  }

  /**
   * @deprecated Use refresh() instead. Kept for backward compatibility.
   */
  public async refreshNASA() {
    return this.refresh();
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

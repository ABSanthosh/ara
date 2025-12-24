import { SettingStore } from "../settings/settings.store";
import { NASAEngine } from "./nasa/nasa.engine";

/**
 * This is the class that manages different types of wallpapers.
 * For now, there are 2 types: preset and NASA APOD.
 * Wallpaper manager will take different 
 */
export class WallpaperManagerImpl {
  private settings = SettingStore;
  constructor() {
    this.settings.stateValue.subscribe((settings) => {
      document.body.style.backgroundImage = `url(${settings.wallpaper.url})`;
    })
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
  }: {
    type: "preset",
    options: { url: string }
  } | {
    type: "nasa",
    options: {
      mode: "dynamic",
      category: "apod",
    } | {
      mode: "static",
      category: "apod",
      date: Date,
    }
  }) {
    if (type === "preset") {
      const presetUrl = options.url;
      this.settings.update((state) => {
        state.wallpaper.activePlugin = "preset";
        state.wallpaper.url = presetUrl;
        return state;
      })
    } else if (type === "nasa") {
      if (options.mode === "dynamic") {
        const wallpaper = await NASAEngine.getAPOD();
        this.settings.update((state) => {
          state.wallpaper.activePlugin = "nasa";
          state.wallpaper.url = wallpaper.url;
          state.wallpaper.plugins.nasa.metadata = wallpaper;
          state.wallpaper.plugins.nasa.mode = "dynamic";
          state.wallpaper.plugins.nasa.category = "apod";
          state.wallpaper.plugins.nasa.lastUpdate = new Date(new Date().setHours(0, 0, 0, 0));

          return state;
        });
      } else if (options.mode === "static") {
        const dateStr = options.date.toISOString().split('T')[0];
        const wallpaper = await NASAEngine.getAPOD({ date: dateStr });
        this.settings.update((state) => {
          state.wallpaper.activePlugin = "nasa";
          state.wallpaper.url = wallpaper.url;
          state.wallpaper.plugins.nasa.metadata = wallpaper;
          state.wallpaper.plugins.nasa.mode = "static";
          state.wallpaper.plugins.nasa.category = "apod";
          state.wallpaper.plugins.nasa.staticDate = options.date;

          return state;
        });
      }
    }
  }

  /**
   * Add current NASA APOD to favorites
   * @param date Date of the APOD to favorite
   */
  public addNasaFavorite(date: string) {
    this.settings.update((state) => {
      const favs = state.wallpaper.plugins.nasa.favorites;
      if (!favs.find(d => d === date)) {
        favs.push(date);
      }
      return state;
    });
  }

  /**
   * Remove a date from NASA APOD favorites
   * @param date Date string to remove from favorites
   */
  public removeNasaFavorite(date: string) {
    this.settings.update((state) => {
      state.wallpaper.plugins.nasa.favorites = state.wallpaper.plugins.nasa.favorites.filter(d => d !== date);
      return state;
    });
  }

  /**
   * Pin current NASA APOD. 
   * Pinning can be used only when in dynamic mode to fix the wallpaper to current APOD.
   * By pinning, the mode will be changed to static with current APOD date.
   */
  public pinCurrentNasaAPOD() {
    this.settings.update((state) => {
      if (state.wallpaper.activePlugin === "nasa" && state.wallpaper.plugins.nasa.mode === "dynamic") {
        const currentDate = state.wallpaper.plugins.nasa.lastUpdate;
        state.wallpaper.plugins.nasa.mode = "static";
        state.wallpaper.plugins.nasa.staticDate = currentDate;
      }
      return state;
    });
  }

  /**
   * Unpin current NASA APOD.
   * By unpinning, the mode will be changed back to dynamic to get daily updates.
   */
  public unpinCurrentNasaAPOD() {
    this.settings.update((state) => {
      if (state.wallpaper.activePlugin === "nasa" && state.wallpaper.plugins.nasa.mode === "static") {
        state.wallpaper.plugins.nasa.mode = "dynamic";
        delete state.wallpaper.plugins.nasa.staticDate;
      }
      return state;
    });
  }
}


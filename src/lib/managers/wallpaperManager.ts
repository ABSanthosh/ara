import {
  fetchAPODByDate,
  fetchRandomAPODs,
  fetchTodaysAPOD,
  type APODResponse,
} from "../utils/NasaWallpaper";
import settingStore from "../stores/setting.store";
import { get } from "svelte/store";

/**
 * Wallpaper manager to handle different wallpaper types
 */
export class WallpaperManager {
  static async refreshNASAWallpaper(): Promise<boolean> {
    // if its a dynamic wallpaper, get a random wallpaper and replace just the url and metadata
    const currentSettings = get(settingStore);

    if (currentSettings.options.wallpaper.type !== "nasa") {
      return false;
    }

    const wallpaper = currentSettings.options.wallpaper;

    try {
      let apodData: APODResponse;

      apodData = (
        await fetchRandomAPODs(currentSettings.wallpapers.nasaAPIKey!, 1)
      )[0];

      settingStore.update((store) => {
        if (store.options.wallpaper.type === "nasa") {
          store.options.wallpaper = {
            type: "nasa",
            url: apodData.hdurl || apodData.url,
            metadata: {
              mode: wallpaper.metadata.mode,
              category: "apod",
              lastUpdate:
                wallpaper.metadata.mode === "dynamic"
                  ? wallpaper.metadata.lastUpdate!
                  : apodData.date,
              ...apodData,
            },
          };
        }
        return store;
      });
      return true;
    } catch (error) {
      console.error("Failed to refresh NASA wallpaper:", error);
    }

    return false;
  }

  /**
   * Updates NASA APOD wallpaper based on frequency setting
   */
  static async updateNASAWallpaper(): Promise<boolean> {
    const currentSettings = get(settingStore);

    if (currentSettings.options.wallpaper.type !== "nasa") {
      return false;
    }

    const wallpaper = currentSettings.options.wallpaper;

    try {
      let apodData: APODResponse;

      // Daily mode - check if we need to update
      const today = new Date().toISOString().split("T")[0];

      if (wallpaper.metadata.lastUpdate === today) {
        // Already updated today, no need to fetch
        return false;
      }

      if (currentSettings.options.wallpaper.metadata.mode === "static") {
        apodData = await fetchAPODByDate(
          currentSettings.wallpapers.nasaAPIKey!,
          wallpaper.metadata.lastUpdate!
        );

        settingStore.update((store) => {
          if (store.options.wallpaper.type === "nasa") {
            store.options.wallpaper = {
              type: "nasa",
              url: apodData.hdurl || apodData.url,
              metadata: {
                mode: "static",
                category: "apod",
                lastUpdate: wallpaper.metadata.lastUpdate!,
                ...apodData,
              },
            };
          }
          return store;
        });
        return true;
      } else {
        // Fetch today's APOD
        apodData = await fetchTodaysAPOD(
          currentSettings.wallpapers.nasaAPIKey!
        );

        // Only update if it's an image
        if (apodData.media_type === "image") {
          settingStore.update((store) => {
            if (store.options.wallpaper.type === "nasa") {
              store.options.wallpaper = {
                type: "nasa",
                url: apodData.hdurl || apodData.url,
                metadata: {
                  mode: "dynamic",
                  category: "apod",
                  lastUpdate: new Date().toISOString().split("T")[0],
                  ...apodData,
                },
              };
            }
            return store;
          });
          return true;
        }
      }
    } catch (error) {
      console.error("Failed to update NASA wallpaper:", error);
    }

    return false;
  }

  /**
   * Gets the current wallpaper URL based on settings
   */
  static getCurrentWallpaperUrl(): string {
    const currentSettings = get(settingStore);
    return currentSettings.options.wallpaper.url;
  }

  /**
   * Checks if the current wallpaper is a NASA APOD
   */
  static isNASAWallpaper(): boolean {
    const currentSettings = get(settingStore);
    return currentSettings.options.wallpaper.type === "nasa";
  }

  /**
   * Heart/unheart the current NASA wallpaper by storing its date
   */
  static toggleHeartWallpaper(): boolean {
    const currentSettings = get(settingStore);
    
    if (currentSettings.options.wallpaper.type !== "nasa") {
      return false;
    }

    const wallpaperDate = currentSettings.options.wallpaper.metadata.date;
    
    if (!wallpaperDate) {
      return false;
    }

    const heartedDates = currentSettings.wallpapers.heartedDates || [];
    const isHearted = heartedDates.includes(wallpaperDate);

    settingStore.update((store) => {
      if (isHearted) {
        // Unheart: remove date from array
        store.wallpapers.heartedDates = heartedDates.filter(
          (date) => date !== wallpaperDate
        );
      } else {
        // Heart: add date to array
        store.wallpapers.heartedDates = [...heartedDates, wallpaperDate];
      }
      return store;
    });

    return true;
  }

  /**
   * Check if the current wallpaper is hearted
   */
  static isWallpaperHearted(): boolean {
    const currentSettings = get(settingStore);
    
    if (currentSettings.options.wallpaper.type !== "nasa") {
      return false;
    }

    const wallpaperDate = currentSettings.options.wallpaper.metadata.date;
    const heartedDates = currentSettings.wallpapers.heartedDates || [];
    
    return wallpaperDate ? heartedDates.includes(wallpaperDate) : false;
  }
}

// Set up auto-update for NASA wallpapers
export function initializeWallpaper() {
  // Update immediately if NASA wallpaper is selected and it's either:
  // 1. Daily mode (check if needs update)
  // 2. Every-refresh mode (always update on page load)
  const currentSettings = get(settingStore);
  if (currentSettings.options.wallpaper.type === "nasa") {
    WallpaperManager.updateNASAWallpaper();
  }
}

export function setDynamicWallpaper(
  mode: "dynamic" | "static",
  staticDate?: string
) {
  const currentSettings = get(settingStore);
  // if (currentSettings.options.wallpaper.type !== "nasa") {
  //   return;
  // }

  if (mode === "dynamic") {
    settingStore.update((store) => {
      store.options.wallpaper.type = "nasa";
      store.options.wallpaper.metadata.mode = "dynamic";
      delete store.options.wallpaper.metadata.lastUpdate;
      return store;
    });
    WallpaperManager.updateNASAWallpaper();
  } else if (mode === "static") {
    const date = new Date(staticDate!).toISOString().split("T")[0];
    if (date) {
      fetchAPODByDate(currentSettings.wallpapers.nasaAPIKey!, date).then(
        (apodData) => {
          if (apodData.media_type === "image") {
            settingStore.update((store) => {
              store.options.wallpaper = {
                type: "nasa",
                url: apodData.hdurl || apodData.url,
                metadata: {
                  mode: "static",
                  category: "apod",
                  lastUpdate: date,
                  ...apodData,
                },
              };
              return store;
            });
          }
        }
      );
    }
  }
}

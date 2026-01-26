import { writable } from "svelte/store";

interface AppState {
  wallpaper: {
    isWallpaperLoading: boolean;
  };
}

const defaultAppState: AppState = {
  wallpaper: {
    isWallpaperLoading: false,
  },
};

export const AppStateStore = writable<AppState>(
  window.localStorage.getItem("appState")
    ? JSON.parse(window.localStorage.getItem("appState") as string)
    : defaultAppState,
);

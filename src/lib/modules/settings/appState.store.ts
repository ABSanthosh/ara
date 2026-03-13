
import { StoreImpl } from "@/lib/utils/store";

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

class AppStateStoreImpl extends StoreImpl<AppState> {
  protected readonly storageKey = "appState";

  constructor() {
    super(defaultAppState);
  }
}

export const AppStateStore = new AppStateStoreImpl();

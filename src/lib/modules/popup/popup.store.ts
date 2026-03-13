import { StoreImpl } from "@/lib/utils/store";
import { TPopupStore } from "./popup.types";

const defaultStore: TPopupStore = {
  internal: {
    isOpen: false,
  },
  apps: {
    turntable: {
      isPlaying: false,
      currentTrack: {
        type: "noise",
        name: "Rain",
        src: "https://s.ambiph.one/sounds/heavy-rain.flac",
        image:
          "https://content.mycutegraphics.com/graphics/rain/rain-cloud.png",
      },
    },
  },
};

class PopupStoreImpl extends StoreImpl<TPopupStore> {
  protected readonly storageKey = "popupStore";
  protected readonly debounceDelay: number = 0;

  constructor() {
    super(defaultStore);
  }
}

export const PopupStore = new PopupStoreImpl();

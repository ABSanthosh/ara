import { writable } from "svelte/store";
import { SupportedCityName } from "../utils/timezone";
import { catStoreActions } from "./catStore";
import { APODResponse } from "../utils/NasaWallpaper";

type Widget = {
  id: string;
  pos: {
    row: number;
    col: number;
  };
};

// Define valid span combinations for each widget type
type AnalogClockSpan =
  | { x: 1; y: 1 } // Small widget
  | { x: 2; y: 2 }; // Large widget

type FlipClockSpan =
  | { x: 2; y: 1 } // Compact widget
  | { x: 2; y: 2 }; // Large widget

type CalendarSpan =
  | { x: 1; y: 1 } // Compact widget
  | { x: 2; y: 2 }; // Large widget

type CatSpan =
  | { x: 1; y: 1 } // Small cat widget
  | { x: 2; y: 2 }; // Large cat widget

type ChecklistSpan =
  | { x: 2; y: 2 }; // Only 2x2 size allowed

// Checklist item interface
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

type AnalogClockWidget = Widget & {
  type: "analog-clock";
  span: AnalogClockSpan;
  settings: {
    showNumbers: boolean;
    showSecondsHand: boolean;
    city?: SupportedCityName;
  };
};

type FlipClockWidget = Widget & {
  type: "flip-clock";
  span: FlipClockSpan;
  settings: {
    showSeconds: boolean;
    city?: SupportedCityName;
  };
};

type CalendarWidget = Widget & {
  type: "calendar";
  span: CalendarSpan;
  settings: {
    city?: SupportedCityName;
  };
};

type CatWidget = Widget & {
  type: "cat";
  span: CatSpan;
  settings: {
    // No specific settings for cat widget currently
  };
};

type ChecklistWidget = Widget & {
  type: "checklist";
  span: ChecklistSpan;
  settings: {
    items: ChecklistItem[];
  };
};

type WallpaperTypes =
  | {
      type: "preset";
      url: string;
      metadata: Record<string, any>;
    }
  | {
      type: "nasa";
      url: string;
      metadata: {
        mode: "dynamic" | "static";
        category: "apod" | "earth" | "mars" | "moon";
        lastUpdate?: string; // ISO date string for dynamic and static modes
      } & APODResponse;
    };

interface SettingStore {
  options: {
    isDraggable: boolean;
    isResizable: boolean;
    wallpaper: WallpaperTypes;
    showGrid: boolean;
  };
  widgets: Record<
    string,
    AnalogClockWidget | FlipClockWidget | CalendarWidget | CatWidget | ChecklistWidget
  >;
  wallpapers: {
    nasaAPIKey?: string; // Store NASA API key if user sets it
    presets: string[]; // Array of preset wallpaper URLs
  };
}

const defaultStore: SettingStore = {
  options: {
    showGrid: true,
    isDraggable: true,
    isResizable: true,
    wallpaper: {
      type: "preset",
      url: "/assets/wallpapers/adwaita-d.jpg",
      metadata: {},
    },
  },
  widgets: {
    "analog-clock-1": {
      id: "analog-clock-1",
      pos: { row: 1, col: 1 },
      type: "analog-clock",
      span: { x: 2, y: 2 },
      settings: {
        showNumbers: true,
        showSecondsHand: true,
      },
    },
    "flip-clock-1": {
      id: "flip-clock-1",
      pos: { row: 1, col: 3 },
      type: "flip-clock",
      span: { x: 2, y: 1 },
      settings: {
        showSeconds: true,
      },
    },
    "calendar-1": {
      id: "calendar-1",
      pos: { row: 3, col: 1 },
      type: "calendar",
      span: { x: 2, y: 2 },
      settings: {},
    },
    "cat-1": {
      id: "cat-1",
      pos: { row: 1, col: 5 },
      type: "cat",
      span: { x: 2, y: 2 },
      settings: {},
    },
    "checklist-1": {
      id: "checklist-1",
      pos: { row: 3, col: 3 },
      type: "checklist",
      span: { x: 2, y: 2 },
      settings: {
        items: [
          {
            id: "1",
            text: "Welcome to your checklist!",
            completed: false,
          },
          {
            id: "2",
            text: "Click the checkbox to complete tasks",
            completed: false,
          },
        ],
      },
    },
  },
  wallpapers: {
    nasaAPIKey: "DEMO_KEY",
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
};

const settingStore = writable<SettingStore>(
  JSON.parse(window.localStorage.getItem("settingStore")!) ?? defaultStore
);

let timer: NodeJS.Timeout | null;

settingStore.subscribe((value) => {
  clearTimeout(timer as NodeJS.Timeout);
  timer = setTimeout(() => {
    window.localStorage.setItem("settingStore", JSON.stringify(value));
  }, 1000);
});

// Cleanup function for when widgets are removed
function cleanupWidget(widgetId: string, widgetType: string) {
  if (widgetType === "cat") {
    catStoreActions.removeCatImage(widgetId);
  }
}

// Helper function to remove a widget and cleanup its resources
export function removeWidget(widgetId: string) {
  settingStore.update((store) => {
    const widget = store.widgets[widgetId];
    if (widget) {
      cleanupWidget(widgetId, widget.type);
      delete store.widgets[widgetId];
    }
    return store;
  });
}

export default settingStore;

// Export span types for use in components
export type { AnalogClockSpan, FlipClockSpan, CalendarSpan, CatSpan, ChecklistSpan, ChecklistItem };

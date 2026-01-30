import { APODResponse } from "../wallpaper/nasa/nasa.types";
import { CatWidget, Widgets } from "../widgets/widgets.types";

export enum SettingsTabs {
  GENERAL = "General",
  APPEARANCE = "Appearance",
  WIDGETS = "Widgets",
}

export type TSettingStore = {
  internal: {
    grid: {
      rows: number;
      cols: number;
      gap: number;
      cellSize: number;
      element: HTMLElement;
      occupiedCells: Set<string>;
    };
    settings: {
      lastVisitedTab: SettingsTabs;
      widgetPane: {
        filterCache: Record<string, {
          cols: number;
          rows: number;
          placedWidgets: Widgets[];
        }>;
      };
    };
    widgetDefaults: {
      CatWidget: CatWidget["settings"];
    };
  };
  options: {
    isDraggable: boolean;
    isResizable: boolean;
    showGrid: boolean;
  };
  widgets: Record<string, Widgets>;
  wallpaper: {
    activePlugin: "preset" | "nasa";
    url: string;
    plugins: {
      nasa: {
        nasaAPIKey?: string; // Store NASA API key if user sets it
        favorites: string[]; // Array of hearted NASA APOD dates in YYYY-MM-DD format
        category: "apod" | "earth" | "mars" | "moon";
        mode: "dynamic" | "static";
        lastUpdate?: Date; // ISO date string of last wallpaper update
        staticDate?: Date; // ISO date string for static wallpaper selection
        metadata: APODResponse | null; // Store metadata of current NASA APOD
      };
      presets: string[]; // Array of preset wallpaper URLs
    };
  };
};

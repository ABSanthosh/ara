import { APODResponse } from "../wallpaper/nasa/nasa.types";
import { Widgets } from "../widgets/widgets.types";

export type TSettingStore = {
  internal: {
    grid: {
      rows: number;
      cols: number;
      gap: number;
      cellSize: number;
      element: HTMLElement;
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

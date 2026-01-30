import { get } from "svelte/store";
import nanoid from "@/lib/utils/nanoid";
import { CatStore } from "../cats/cats.stores";
import { TSettingStore } from "../settings/settings.types";
import type { Widgets } from "@/lib/modules/widgets/widgets.types";
import { SettingStore } from "@/lib/modules/settings/settings.store";

class WidgetEngineImpl {
  private widgets: Record<string, Widgets> = {};
  private internalState: TSettingStore["internal"] = get(SettingStore).internal;
  private unsubscribe: () => void;

  constructor() {
    this.unsubscribe = SettingStore.subscribe((settings) => {
      this.widgets = settings.widgets;
      this.internalState = settings.internal;
    });
  }

  onDestroy() {
    this.unsubscribe();
  }

  // Add, remove, update
  public addWidget(widget: Widgets) {
    const widgetId = nanoid();

    const spanX = widget.span.x;
    const spanY = widget.span.y;

    // If widget span exceeds grid size, do not place
    if (
      spanX > this.internalState.grid.cols ||
      spanY > this.internalState.grid.rows
    ) {
      return;
    }

    // TODO: what is this for? AI slop
    // Copy default settings to the new widget if it's a CatWidget
    if (widget.type === "cat") {
      widget.settings = {
        ...this.internalState.widgetDefaults.CatWidget,
        ...widget.settings,
      };
    }

    // Update centralized occupied cells state
    SettingStore.updateOccupiedCells();
    const occupiedCells = this.internalState.grid.occupiedCells;

    // Try to find a place in the grid
    for (let row = 1; row <= this.internalState.grid.rows - spanY + 1; row++) {
      for (
        let col = 1;
        col <= this.internalState.grid.cols - spanX + 1;
        col++
      ) {
        let canPlace = true;
        for (let r = row; r < row + spanY; r++) {
          for (let c = col; c < col + spanX; c++) {
            if (
              r > this.internalState.grid.rows ||
              c > this.internalState.grid.cols ||
              occupiedCells.has(`${r}-${c}`)
            ) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        if (canPlace) {
          widget.id = widgetId;
          widget.pos = { row, col };
          SettingStore.update((state) => {
            state.widgets[widgetId] = widget;
            return state;
          });
          return;
        }
      }
    }

    // No place found, do not add widget
  }

  public removeWidget(widgetId: string) {
    const widget = this.widgets[widgetId];

    // Clean up widget-specific resources
    if (widget && widget.type === "cat") {
      // Import CatStore dynamically to avoid circular dependency
      CatStore.removeMagazine(widgetId);
    }

    SettingStore.update((state) => {
      delete state.widgets[widgetId];
      return state;
    });
  }

  public subscribeTo(widgetId: string, callback: (widget: Widgets) => void) {
    return SettingStore.subscribe((settings) => {
      const widget = settings.widgets[widgetId];
      if (widget) {
        callback(widget);
      }
    });
  }

  public updateWidget(widgetId: string, updatedFields: Partial<Widgets>) {
    SettingStore.update((state) => {
      const widget = state.widgets[widgetId];
      if (widget) {
        // Simplified: all cases do the same thing
        state.widgets[widgetId] = {
          ...widget,
          ...(updatedFields as Partial<typeof widget>),
        } as Widgets;
      }
      return state;
    });
  }
}

export const WidgetEngine = new WidgetEngineImpl();

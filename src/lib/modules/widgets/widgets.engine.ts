import nanoid from "@/lib/utils/nanoid";
import { SettingStore } from "@/lib/modules/settings/settings.store";
import type { Widgets } from "@/lib/modules/widgets/widgets.types";
import { TSettingStore } from "../settings/settings.types";
import { get } from "svelte/store";

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

    const occupiedCells: Set<string> = new Set();
    Object.values(this.widgets).forEach((w) => {
      for (let r = w.pos.row; r < w.pos.row + w.span.y; r++) {
        for (let c = w.pos.col; c < w.pos.col + w.span.x; c++) {
          occupiedCells.add(`${r},${c}`);
        }
      }
    });

    // Try to find a place in the grid
    for (
      let row = 1;
      row <= this.internalState.grid.rows - spanY + 1;
      row++
    ) {
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
              occupiedCells.has(`${r},${c}`)
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
    SettingStore.update((state) => {
      delete state.widgets[widgetId];
      return state;
    });
  }
}

export const WidgetEngine = new WidgetEngineImpl();

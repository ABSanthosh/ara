import { get } from "svelte/store";
import { SettingStore } from "../../settings/settings.store";
import { Widgets } from "../widgets.types";

function WidgetDragShadow() {
  const shadow = document.createElement("div");
  shadow.className = "widget-drag-shadow";
  document.body.appendChild(shadow);
  return shadow;
}

const occupiedCells = new Set<string>();

export function draggable(draggedWidget: HTMLElement, widgetId: string) {
  let localSettingsCopy = $state(get(SettingStore));
  SettingStore.subscribe((settings) => {
    localSettingsCopy = settings;
  });

  let currentWidget = $derived(localSettingsCopy.widgets[widgetId]);
  let gridInfo = $derived(localSettingsCopy.internal.grid);
  let shadow: HTMLElement = $state(WidgetDragShadow());
  let shadowPos = $state({ row: 1, col: 1 });
  const isDraggable = $derived(localSettingsCopy.options.isDraggable);
  let isDragging = $state(false);

  $inspect(isDragging);

  let lastMouseGrid = $state({ row: -1, col: -1 });
  let offsetX = $state(0);
  let offsetY = $state(0);
  let lastUpdateX = $state(0);
  let lastUpdateY = $state(0);

  function updateOccupiedCells() {
    occupiedCells.clear();
    const widgets = localSettingsCopy.widgets;

    // Add all cells occupied by widgets
    Object.values(widgets).forEach((w) => {
      if (w.id === widgetId) return;

      for (let row = w.pos.row; row < w.pos.row + w.span.y; row++) {
        for (let col = w.pos.col; col < w.pos.col + w.span.x; col++) {
          occupiedCells.add(`${row}-${col}`);
        }
      }
    });
  }

  function getMouseGridPosition(mouseX: number, mouseY: number) {
    const rect = gridInfo.element.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    const col = Math.floor(relativeX / (gridInfo.cellSize + gridInfo.gap)) + 1;
    const row = Math.floor(relativeY / (gridInfo.cellSize + gridInfo.gap)) + 1;

    return {
      row: Math.max(1, Math.min(row, gridInfo.rows)),
      col: Math.max(1, Math.min(col, gridInfo.cols)),
    };
  }

  function gridPositionToRect(
    row: number,
    col: number,
    spanX: number,
    spanY: number
  ) {
    const gridRect = gridInfo.element.getBoundingClientRect();
    const x = gridRect.left + (col - 1) * (gridInfo.cellSize + gridInfo.gap);
    const y = gridRect.top + (row - 1) * (gridInfo.cellSize + gridInfo.gap);
    const width = spanX * gridInfo.cellSize + (spanX - 1) * gridInfo.gap;
    const height = spanY * gridInfo.cellSize + (spanY - 1) * gridInfo.gap;

    return { x, y, width, height };
  }

  function updateShadowPosition(
    row: number,
    col: number,
    spanX: number,
    spanY: number
  ) {
    const rect = gridPositionToRect(row, col, spanX, spanY);
    shadow.style.left = `${rect.x}px`;
    shadow.style.top = `${rect.y}px`;
    shadow.style.width = `${rect.width}px`;
    shadow.style.height = `${rect.height}px`;
    shadow.style.opacity = "1";

    shadowPos = { row, col };
  }

  function isValidPosition(
    row: number,
    col: number,
    spanX: number,
    spanY: number
  ) {
    if (
      row < 1 ||
      col < 1 ||
      row + spanY - 1 > gridInfo.rows ||
      col + spanX - 1 > gridInfo.cols
    )
      return false;

    for (let r = row; r < row + spanY; r++) {
      for (let c = col; c < col + spanX; c++) {
        if (occupiedCells.has(`${r}-${c}`)) return false;
      }
    }
    return true;
  }

  function findNearestValidPosition(
    targetRow: number,
    targetCol: number,
    spanX: number,
    spanY: number
  ) {
    const maxRadius = Math.max(gridInfo.rows, gridInfo.cols);

    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc of [-radius, radius]) {
          const row = targetRow + dr;
          const col = targetCol + dc;
          if (isValidPosition(row, col, spanX, spanY)) {
            return { row, col };
          }
        }
      }

      for (let dc = -radius + 1; dc <= radius - 1; dc++) {
        for (let dr of [-radius, radius]) {
          const row = targetRow + dr;
          const col = targetCol + dc;
          if (isValidPosition(row, col, spanX, spanY)) {
            return { row, col };
          }
        }
      }
    }

    return { row: targetRow, col: targetCol };
  }

  function getBestSnapPosition(
    widgetX: number,
    widgetY: number,
    spanX: number,
    spanY: number
  ) {
    // const gridRect = gridInfo.element.getBoundingClientRect();

    const widgetWidth =
      spanX * gridInfo.cellSize + (spanX - 1) * gridInfo.gap;
    const widgetHeight =
      spanY * gridInfo.cellSize + (spanY - 1) * gridInfo.gap;

    const widgetCenterX = widgetX + widgetWidth / 2;
    const widgetCenterY = widgetY + widgetHeight / 2;

    const centerGrid = getMouseGridPosition(widgetCenterX, widgetCenterY);

    let bestPos = { row: centerGrid.row, col: centerGrid.col };
    let bestOverlap = 0;

    const searchRadius = Math.max(spanX, spanY) + 1;

    const minRow = Math.max(1, centerGrid.row - searchRadius);
    const maxRow = Math.min(
      gridInfo.rows - spanY + 1,
      centerGrid.row + searchRadius
    );
    const minCol = Math.max(1, centerGrid.col - searchRadius);
    const maxCol = Math.min(
      gridInfo.cols - spanX + 1,
      centerGrid.col + searchRadius
    );

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isValidPosition(row, col, spanX, spanY)) continue;

        const cell = gridPositionToRect(row, col, spanX, spanY);

        const overlapLeft = Math.max(widgetX, cell.x);
        const overlapTop = Math.max(widgetY, cell.y);
        const overlapRight = Math.min(widgetX + widgetWidth, cell.x + cell.width);
        const overlapBottom = Math.min(
          widgetY + widgetHeight,
          cell.y + cell.height
        );

        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        const overlapArea = overlapWidth * overlapHeight;

        if (overlapArea > bestOverlap) {
          bestOverlap = overlapArea;
          bestPos = { row, col };
        }
      }
    }

    const widgetArea = widgetWidth * widgetHeight;
    if (bestOverlap / widgetArea > 0.4) {
      return bestPos;
    }

    return findNearestValidPosition(
      centerGrid.row,
      centerGrid.col,
      spanX,
      spanY
    );
  }

  function onMouseDown(event: MouseEvent) {
    if (!isDraggable || event.button !== 0) return;

    event.preventDefault();
    isDragging = true;

    const rect = draggedWidget.getBoundingClientRect();

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    lastUpdateX = rect.left;
    lastUpdateY = rect.top;

    updateOccupiedCells();

    // Initialize shadow at current widget position
    shadow = WidgetDragShadow();
    shadowPos = { ...currentWidget.pos };
    updateShadowPosition(
      currentWidget.pos.row,
      currentWidget.pos.col,
      currentWidget.span.x,
      currentWidget.span.y
    );

    // Style dragged widget
    draggedWidget.style.position = "fixed";
    draggedWidget.style.left = `${rect.left}px`;
    draggedWidget.style.top = `${rect.top}px`;
    draggedWidget.style.width = `${rect.width}px`;
    draggedWidget.style.height = `${rect.height}px`;
    draggedWidget.style.zIndex = "1001";
    draggedWidget.style.pointerEvents = "none";
    draggedWidget.style.transform = "scale(1.05)";
    draggedWidget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
    draggedWidget.style.transition = "transform 0.2s ease";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onWindowResize);
    document.body.classList.add("dragging-in-progress");
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    event.preventDefault();

    const widgetX = event.clientX - offsetX;
    const widgetY = event.clientY - offsetY;

    draggedWidget.style.left = `${widgetX}px`;
    draggedWidget.style.top = `${widgetY}px`;

    const deltaX = Math.abs(widgetX - lastUpdateX);
    const deltaY = Math.abs(widgetY - lastUpdateY);

    const threshold = 8;
    if (deltaX < threshold && deltaY < threshold) return;

    const bestPos = getBestSnapPosition(
      widgetX,
      widgetY,
      currentWidget.span.x,
      currentWidget.span.y
    );

    if (
      bestPos.row !== shadowPos.row ||
      bestPos.col !== shadowPos.col
    ) {
      updateShadowPosition(
        bestPos.row,
        bestPos.col,
        currentWidget.span.x,
        currentWidget.span.y
      );
      lastUpdateX = widgetX;
      lastUpdateY = widgetY;
    }
  }

  function onMouseUp(event: MouseEvent) {
    if (!isDragging) return;
    event.preventDefault();

    const finalRow = shadowPos.row;
    const finalCol = shadowPos.col;

    const rect = gridPositionToRect(
      finalRow,
      finalCol,
      currentWidget.span.x,
      currentWidget.span.y
    );

    // Animate widget into place
    draggedWidget.style.transition =
      "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    draggedWidget.style.left = `${rect.x}px`;
    draggedWidget.style.top = `${rect.y}px`;
    draggedWidget.style.transform = "scale(1)";
    draggedWidget.style.boxShadow = "none";

    // Commit grid position AFTER animation
    setTimeout(() => {
      // Reset inline drag styles
      draggedWidget.style.position = "";
      draggedWidget.style.left = "";
      draggedWidget.style.top = "";
      draggedWidget.style.width = "";
      draggedWidget.style.height = "";
      draggedWidget.style.zIndex = "";
      draggedWidget.style.pointerEvents = "";
      draggedWidget.style.transform = "";
      draggedWidget.style.transition = "";
      draggedWidget.style.boxShadow = "";

      // Apply final grid placement
      draggedWidget.style.gridArea = `${finalRow} / ${finalCol} / ${finalRow + currentWidget.span.y
        } / ${finalCol + currentWidget.span.x}`;


      SettingStore.update((s) => {
        s.widgets[widgetId].pos = { row: finalRow, col: finalCol };
        return s;
      });
    }, 300);

    // Fade out shadow
    shadow.style.opacity = "0";
    setTimeout(() => shadow.remove(), 200);

    // Cleanup listeners
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("resize", onWindowResize);
    document.body.classList.remove("dragging-in-progress");

    isDragging = false;
  }


  function onWindowResize() {
    if (!isDragging) return;

    updateShadowPosition(
      shadowPos.row,
      shadowPos.col,
      currentWidget.span.x,
      currentWidget.span.y
    );
  }

  draggedWidget.addEventListener("mousedown", onMouseDown);

  return {
    destroy() {
      draggedWidget.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onWindowResize);
      shadow.remove();
    },
  };
}

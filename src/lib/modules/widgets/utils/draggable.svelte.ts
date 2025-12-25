import { get } from "svelte/store";
import { SettingStore } from "../../settings/settings.store";

function createDragShadow() {
  const el = document.createElement("div");
  el.className = "widget-drag-shadow";
  el.style.opacity = "0";
  document.body.appendChild(el);
  return el;
}

const occupiedCells = new Set<string>();

type DragState =
  | { type: "idle" }
  | {
    type: "dragging";
    offsetX: number;
    offsetY: number;
  };

export function draggable(draggedWidget: HTMLElement, widgetId: string) {
  /* ---------------------------------- */
  /* Store + derived state               */
  /* ---------------------------------- */

  let settings = get(SettingStore);
  const unsubscribe = SettingStore.subscribe((v) => (settings = v));

  const getWidget = () => settings.widgets[widgetId];
  const getGrid = () => settings.internal.grid;

  /* ---------------------------------- */
  /* Drag state                          */
  /* ---------------------------------- */

  let dragState: DragState = $state({ type: "idle" });

  let shadow = $state(createDragShadow());
  let shadowPos = $state({ row: 1, col: 1 });
  let isDragging = $state(false);

  let lastUpdateX = $state(0);
  let lastUpdateY = $state(0);

  /* RAF debouncing */
  let rafId: number | null = $state(null);
  let pendingEvent: MouseEvent | null = $state(null);

  /* ---------------------------------- */
  /* Grid helpers                        */
  /* ---------------------------------- */

  function updateOccupiedCells() {
    occupiedCells.clear();

    Object.values(settings.widgets).forEach((w) => {
      if (w.id === widgetId) return;

      for (let r = w.pos.row; r < w.pos.row + w.span.y; r++) {
        for (let c = w.pos.col; c < w.pos.col + w.span.x; c++) {
          occupiedCells.add(`${r}-${c}`);
        }
      }
    });
  }

  function isValid(row: number, col: number, sx: number, sy: number) {
    const g = getGrid();
    if (
      row < 1 ||
      col < 1 ||
      row + sy - 1 > g.rows ||
      col + sx - 1 > g.cols
    )
      return false;

    for (let r = row; r < row + sy; r++) {
      for (let c = col; c < col + sx; c++) {
        if (occupiedCells.has(`${r}-${c}`)) return false;
      }
    }
    return true;
  }

  function gridRect(row: number, col: number, sx: number, sy: number) {
    const g = getGrid();
    const rect = g.element.getBoundingClientRect();

    return {
      x: rect.left + (col - 1) * (g.cellSize + g.gap),
      y: rect.top + (row - 1) * (g.cellSize + g.gap),
      width: sx * g.cellSize + (sx - 1) * g.gap,
      height: sy * g.cellSize + (sy - 1) * g.gap,
    };
  }

  function mouseToGrid(x: number, y: number) {
    const g = getGrid();
    const rect = g.element.getBoundingClientRect();

    return {
      row: Math.max(
        1,
        Math.min(
          Math.floor((y - rect.top) / (g.cellSize + g.gap)) + 1,
          g.rows
        )
      ),
      col: Math.max(
        1,
        Math.min(
          Math.floor((x - rect.left) / (g.cellSize + g.gap)) + 1,
          g.cols
        )
      ),
    };
  }

  function updateShadow(row: number, col: number) {
    const w = getWidget();
    const r = gridRect(row, col, w.span.x, w.span.y);

    shadow.style.left = `${r.x}px`;
    shadow.style.top = `${r.y}px`;
    shadow.style.width = `${r.width}px`;
    shadow.style.height = `${r.height}px`;
    shadow.style.opacity = "1";

    shadowPos = { row, col };
  }

  /* ---------------------------------- */
  /* Snapping logic                     */
  /* ---------------------------------- */

  function getBestSnap(x: number, y: number) {
    const w = getWidget();
    const g = getGrid();

    const widgetW = w.span.x * g.cellSize + (w.span.x - 1) * g.gap;
    const widgetH = w.span.y * g.cellSize + (w.span.y - 1) * g.gap;

    const center = mouseToGrid(x + widgetW / 2, y + widgetH / 2);

    let best = center;
    let bestOverlap = 0;

    const radius = Math.max(w.span.x, w.span.y) + 1;

    for (let r = center.row - radius; r <= center.row + radius; r++) {
      for (let c = center.col - radius; c <= center.col + radius; c++) {
        if (!isValid(r, c, w.span.x, w.span.y)) continue;

        const cell = gridRect(r, c, w.span.x, w.span.y);

        const overlapX = Math.max(
          0,
          Math.min(x + widgetW, cell.x + cell.width) - Math.max(x, cell.x)
        );
        const overlapY = Math.max(
          0,
          Math.min(y + widgetH, cell.y + cell.height) - Math.max(y, cell.y)
        );

        const area = overlapX * overlapY;
        if (area > bestOverlap) {
          bestOverlap = area;
          best = { row: r, col: c };
        }
      }
    }

    return best;
  }

  /* ---------------------------------- */
  /* RAF mouse handling                 */
  /* ---------------------------------- */

  function queueMove(e: MouseEvent) {
    pendingEvent = e;
    if (rafId === null) {
      rafId = requestAnimationFrame(processMove);
    }
  }

  function processMove() {
    if (!pendingEvent || dragState.type !== "dragging") {
      rafId = null;
      return;
    }

    const e = pendingEvent;
    pendingEvent = null;

    const x = e.clientX - dragState.offsetX;
    const y = e.clientY - dragState.offsetY;

    draggedWidget.style.left = `${x}px`;
    draggedWidget.style.top = `${y}px`;

    if (
      Math.abs(x - lastUpdateX) > 8 ||
      Math.abs(y - lastUpdateY) > 8
    ) {
      const snap = getBestSnap(x, y);
      if (
        snap.row !== shadowPos.row ||
        snap.col !== shadowPos.col
      ) {
        updateShadow(snap.row, snap.col);
        lastUpdateX = x;
        lastUpdateY = y;
      }
    }

    rafId = null;
  }

  /* ---------------------------------- */
  /* Lifecycle                          */
  /* ---------------------------------- */

  function startDrag(e: MouseEvent) {
    if (e.button !== 0 || dragState.type !== "idle") return;

    const rect = draggedWidget.getBoundingClientRect();

    dragState = {
      type: "dragging",
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    isDragging = true;
    updateOccupiedCells();

    shadow = createDragShadow();
    updateShadow(getWidget().pos.row, getWidget().pos.col);

    draggedWidget.style.position = "fixed";
    draggedWidget.style.left = `${rect.left}px`;
    draggedWidget.style.top = `${rect.top}px`;
    draggedWidget.style.width = `${rect.width}px`;
    draggedWidget.style.height = `${rect.height}px`;
    draggedWidget.style.zIndex = "1001";
    draggedWidget.style.pointerEvents = "none";
    draggedWidget.style.transform = "scale(1.05)";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (dragState.type === "dragging") queueMove(e);
  }

  function onMouseUp() {
    if (dragState.type !== "dragging") return;

    const w = getWidget();
    const final = shadowPos;
    const rect = gridRect(final.row, final.col, w.span.x, w.span.y);

    draggedWidget.style.transition = "all 0.3s ease";
    draggedWidget.style.left = `${rect.x}px`;
    draggedWidget.style.top = `${rect.y}px`;
    draggedWidget.style.transform = "scale(1)";

    setTimeout(() => {
      draggedWidget.style.transition = "";
      draggedWidget.style.position = "";
      draggedWidget.style.left = "";
      draggedWidget.style.top = "";
      draggedWidget.style.width = "";
      draggedWidget.style.height = "";
      draggedWidget.style.zIndex = "";
      draggedWidget.style.pointerEvents = "";
      draggedWidget.style.transform = "";

      draggedWidget.style.gridArea = `${final.row} / ${final.col} / ${final.row + w.span.y
        } / ${final.col + w.span.x}`;

      SettingStore.update((s) => {
        s.widgets[widgetId].pos = final;
        return s;
      });
    }, 300);

    shadow.style.opacity = "0";
    setTimeout(() => shadow.remove(), 200);

    cleanup();
  }

  function cleanup() {
    dragState = { type: "idle" };
    isDragging = false;

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    pendingEvent = null;

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  draggedWidget.addEventListener("mousedown", startDrag);

  return {
    destroy() {
      cleanup();
      unsubscribe();
      draggedWidget.removeEventListener("mousedown", startDrag);
      shadow.remove();
    },
  };
}

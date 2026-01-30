import { get } from "svelte/store";
import { SettingStore } from "../../settings/settings.store";
import { WidgetEngine } from "../widgets.engine";

/**
 * Mental model:
 * - Mousedown starts a drag,
 * - Mousemove queues frames,
 * - Frames update widget + shadow,
 * - Mouseup commits the shadow and resets everything.
 */

function createDragShadow() {
  const el = document.createElement("div");
  el.className = "widget-drag-shadow";
  el.style.opacity = "0";
  document.body.appendChild(el);
  return el;
}

function makeRemoveButton(widgetId: string) {
  const btn = document.createElement("button");
  btn.innerHTML = `&times;`;
  btn.className = "widget-remove";
  btn.setAttribute("data-drag-ignore", "true");
  btn.onclick = () => {
    WidgetEngine.removeWidget(widgetId);
  };
  return btn;
}

function setPointerEvents(
  el: HTMLElement,
  disable: boolean,
  button: HTMLButtonElement,
) {
  // Disable pointer events on all children except the remove button and those with [data-drag-ignore]
  Array.from(el.children).forEach((child) => {
    const childEl = child as HTMLElement;
    if (childEl !== button && !childEl.hasAttribute("data-drag-ignore")) {
      childEl.style.pointerEvents = disable ? "none" : "";
      childEl.style.touchAction = disable ? "none" : "";
      childEl.style.userSelect = disable ? "none" : "";
    }
  });

  // Always ensure the button is interactive when attached
  button.style.pointerEvents = "auto";
  button.style.touchAction = "auto";
  button.style.userSelect = "none";
}

const occupiedCells = new Set<string>();

type DragState =
  | { type: "idle" }
  | {
      type: "dragging";
      offsetX: number;
      offsetY: number;
    };

export function draggable(
  draggedWidget: HTMLElement,
  options: { widgetId: string; isDemo?: boolean },
) {
  // If demo mode, do nothing
  if (options.isDemo) {
    return {
      destroy() {},
    };
  }

  /* ---------------------------------- */
  /* Store + derived state               */
  /* ---------------------------------- */

  const removeButton = makeRemoveButton(options.widgetId);

  function attachRemoveButton() {
    if (!draggedWidget.contains(removeButton)) {
      draggedWidget.appendChild(removeButton);
    }
    setPointerEvents(draggedWidget, true, removeButton);
    draggedWidget.classList.add("dragging-pane");
  }

  function detachRemoveButton() {
    removeButton.remove();
    setPointerEvents(draggedWidget, false, removeButton);
    draggedWidget.classList.remove("dragging-pane");
  }

  let settings = get(SettingStore);
  const unsubscribe = SettingStore.subscribe((v) => {
    const wasDraggable = settings.options.isDraggable;
    settings = v;

    if (v.options.isDraggable) {
      attachRemoveButton();
    } else {
      detachRemoveButton();
    }

    if (
      wasDraggable &&
      !v.options.isDraggable &&
      dragState.type === "dragging"
    ) {
      cancelDrag();
    }
  });

  const getWidget = () => settings.widgets[options.widgetId];
  const getGrid = () => settings.internal.grid;

  /* ---------------------------------- */
  /* Drag state                         */
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
  /* Grid helpers                       */
  /* ---------------------------------- */

  function updateOccupiedCells() {
    occupiedCells.clear();

    Object.values(settings.widgets).forEach((w) => {
      if (w.id === options.widgetId) return;

      for (let r = w.pos.row; r < w.pos.row + w.span.y; r++) {
        for (let c = w.pos.col; c < w.pos.col + w.span.x; c++) {
          occupiedCells.add(`${r}-${c}`);
        }
      }
    });
  }

  function isValid(row: number, col: number, sx: number, sy: number) {
    const g = getGrid();
    if (row < 1 || col < 1 || row + sy - 1 > g.rows || col + sx - 1 > g.cols)
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
        Math.min(Math.floor((y - rect.top) / (g.cellSize + g.gap)) + 1, g.rows),
      ),
      col: Math.max(
        1,
        Math.min(
          Math.floor((x - rect.left) / (g.cellSize + g.gap)) + 1,
          g.cols,
        ),
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

    let best: { row: number; col: number } | null = null;
    let bestOverlap = 0;

    const radius = Math.max(w.span.x, w.span.y) + 1;

    for (let r = center.row - radius; r <= center.row + radius; r++) {
      for (let c = center.col - radius; c <= center.col + radius; c++) {
        if (!isValid(r, c, w.span.x, w.span.y)) continue;

        const cell = gridRect(r, c, w.span.x, w.span.y);

        const overlapX =
          Math.min(x + widgetW, cell.x + cell.width) - Math.max(x, cell.x);
        const overlapY =
          Math.min(y + widgetH, cell.y + cell.height) - Math.max(y, cell.y);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const area = overlapX * overlapY;
        if (area > bestOverlap) {
          bestOverlap = area;
          best = { row: r, col: c };
        }
      }
    }

    // NEVER return an invalid cell
    if (best) return best;

    // fallback: keep previous valid shadow position
    return shadowPos;
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

    if (Math.abs(x - lastUpdateX) > 8 || Math.abs(y - lastUpdateY) > 8) {
      const snap = getBestSnap(x, y);
      if (snap.row !== shadowPos.row || snap.col !== shadowPos.col) {
        updateShadow(snap.row, snap.col);
      }
      lastUpdateX = x;
      lastUpdateY = y;
    }

    rafId = null;
  }

  /* ---------------------------------- */
  /* Lifecycle                          */
  /* ---------------------------------- */

  function startDrag(e: MouseEvent) {
    if (!settings.options.isDraggable) return;
    if (e.button !== 0 || dragState.type !== "idle") return;

    const target = e.target as HTMLElement;
    if (target.closest("[data-drag-ignore]")) return;

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

    draggedWidget.classList.add("dragging");
    draggedWidget.style.position = "fixed";
    draggedWidget.style.left = `${rect.left}px`;
    draggedWidget.style.top = `${rect.top}px`;
    draggedWidget.style.width = `${rect.width}px`;
    draggedWidget.style.height = `${rect.height}px`;
    draggedWidget.style.zIndex = "1001";
    setPointerEvents(draggedWidget, true, removeButton);
    // draggedWidget.style.transform = "scale(1.05)";

    document.body.classList.add("dragging-in-progress");

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (dragState.type === "dragging") queueMove(e);
  }

  function onMouseUp() {
    if (dragState.type !== "dragging") return;

    const w = getWidget();
    let final = shadowPos;

    if (!isValid(final.row, final.col, w.span.x, w.span.y)) {
      final = w.pos;
    }

    const rect = gridRect(final.row, final.col, w.span.x, w.span.y);

    draggedWidget.style.transition = "all 0.3s ease";
    draggedWidget.style.left = `${rect.x}px`;
    draggedWidget.style.top = `${rect.y}px`;
    draggedWidget.style.transform = "scale(1)";

    setTimeout(() => {
      draggedWidget.classList.remove("dragging");
      draggedWidget.style.transition = "";
      draggedWidget.style.position = "";
      draggedWidget.style.left = "";
      draggedWidget.style.top = "";
      draggedWidget.style.width = "";
      draggedWidget.style.height = "";
      draggedWidget.style.zIndex = "";
      setPointerEvents(draggedWidget, false, removeButton);
      draggedWidget.style.transform = "";

      draggedWidget.style.gridArea = `${final.row} / ${final.col} / ${
        final.row + w.span.y
      } / ${final.col + w.span.x}`;

      SettingStore.update((s) => {
        s.widgets[options.widgetId].pos = final;
        return s;
      });
    }, 300);

    shadow.style.opacity = "0";
    setTimeout(() => shadow.remove(), 200);

    cleanup();
  }

  function cancelDrag() {
    if (dragState.type !== "dragging") return;

    draggedWidget.style.transition = "";
    draggedWidget.style.position = "";
    draggedWidget.style.left = "";
    draggedWidget.style.top = "";
    draggedWidget.style.width = "";
    draggedWidget.style.height = "";
    draggedWidget.style.zIndex = "";
    setPointerEvents(draggedWidget, false, removeButton);
    draggedWidget.style.transform = "";

    shadow?.remove();
    cleanup();
  }

  function cleanup() {
    dragState = { type: "idle" };
    isDragging = false;

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    pendingEvent = null;

    document.body.classList.remove("dragging-in-progress");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  draggedWidget.addEventListener("mousedown", startDrag);

  const r = (min: number, max: number) => Math.random() * (max - min) + min;

  draggedWidget.style.setProperty("--rot", `${r(0.4, 0.7)}deg`);
  draggedWidget.style.setProperty("--dx", `${r(-0.6, 0.6)}px`);
  draggedWidget.style.setProperty("--dy", `${r(-0.6, 0.6)}px`);
  draggedWidget.style.animationDuration = `${r(0.32, 0.38)}s`;
  draggedWidget.style.animationDelay = `${-r(0, 0.3)}s`;

  return {
    destroy() {
      cleanup();
      unsubscribe();
      draggedWidget.removeEventListener("mousedown", startDrag);
      shadow.remove();
    },
  };
}

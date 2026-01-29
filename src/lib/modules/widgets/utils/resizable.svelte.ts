import { get } from "svelte/store";
import { SettingStore } from "../../settings/settings.store";
import {
  ClockWidgetClassicAnalogSpan,
  CalendarSpan,
  CatSpan,
  ChecklistSpan,
  ClockWidgetFlipSpan,
} from "../widgets.types";

/**
 * Mental model:
 * - Click handle starts resize,
 * - Mousemove calculates new span,
 * - Visual feedback shows valid/invalid,
 * - Mouseup commits the new size.
 */

function makeResizeHandle() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "widget-resize-handle");
  svg.setAttribute("data-drag-ignore", "true");
  svg.setAttribute("width", "25");
  svg.setAttribute("height", "25");
  svg.setAttribute("viewBox", "0 0 45 45");
  svg.setAttribute("fill", "none");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M36.0005 9C36.0005 9 36.0005 19.5 28.5005 27C21.0005 34.5 9.00049 33.5 9.00049 33.5",
  );
  path.setAttribute("stroke-width", "18");
  path.setAttribute("stroke-miterlimit", "10");
  path.setAttribute("stroke-linecap", "round");

  svg.appendChild(path);
  return svg;
}

const occupiedCells = new Set<string>();

type ResizeState =
  | { type: "idle" }
  | {
      type: "resizing";
      startX: number;
      startY: number;
      initialSpan: { x: number; y: number };
    };

export function resizable(
  resizedWidget: HTMLElement,
  options: {
    widgetId: string;
    spans:
      | CatSpan[]
      | CalendarSpan[]
      | ClockWidgetFlipSpan[]
      | ChecklistSpan[]
      | ClockWidgetClassicAnalogSpan[];
    onResize?: (newSpan: { x: number; y: number }) => void;
    onResizeStateChange?: (resizeState: ResizeState) => void;
    isDemo?: boolean;
  },
) {
  // If demo mode, do nothing
  if (options.isDemo) {
    return {
      destroy() {},
    };
  }

  /* ---------------------------------- */
  /* Store + derived state              */
  /* ---------------------------------- */

  const resizeHandle = makeResizeHandle();

  function attachResizeHandle() {
    if (!resizedWidget.contains(resizeHandle)) {
      resizedWidget.appendChild(resizeHandle);
    }
    resizedWidget.classList.add("resizing-pane");
  }

  function detachResizeHandle() {
    resizeHandle.remove();
    resizedWidget.classList.remove("resizing-pane");
  }

  let settings = get(SettingStore);
  const unsubscribe = SettingStore.subscribe((v) => {
    const wasResizable = settings.options.isResizable;
    settings = v;

    if (v.options.isResizable) {
      attachResizeHandle();
    } else {
      detachResizeHandle();
    }

    if (
      wasResizable &&
      !v.options.isResizable &&
      resizeState.type === "resizing"
    ) {
      cancelResize();
    }
  });

  const getWidget = () => settings.widgets[options.widgetId];
  const getGrid = () => settings.internal.grid;

  /* ---------------------------------- */
  /* Resize state                       */
  /* ---------------------------------- */

  let resizeState: ResizeState = $state({ type: "idle" });
  let currentSpan = $state({ x: 1, y: 1 });
  let isTransitioning = $state(false);

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

  function isValid(row: number, col: number, sx: number, sy: number): boolean {
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

  /* ---------------------------------- */
  /* Resize logic                       */
  /* ---------------------------------- */

  function getValidSpanFromDelta(deltaX: number, deltaY: number) {
    if (resizeState.type !== "resizing") {
      return { x: 1, y: 1, isValid: false };
    }

    const g = getGrid();
    const w = getWidget();
    const initial = resizeState.initialSpan;

    // Calculate cell movement
    const cellsX = Math.round(deltaX / (g.cellSize + g.gap));
    const cellsY = Math.round(deltaY / (g.cellSize + g.gap));

    // Calculate new span
    let newX = Math.max(1, initial.x + cellsX);
    let newY = Math.max(1, initial.y + cellsY);

    // Clamp to grid bounds
    const maxX = g.cols - w.pos.col + 1;
    const maxY = g.rows - w.pos.row + 1;
    newX = Math.min(newX, maxX);
    newY = Math.min(newY, maxY);

    // Check validity
    const targetIsValid = isValid(w.pos.row, w.pos.col, newX, newY);

    // If using allowed sizes, snap to closest
    if (options.spans && options.spans.length > 0) {
      let best = initial;
      let bestDist = Infinity;
      let foundValid = false;

      for (const span of options.spans) {
        if (
          span.x <= maxX &&
          span.y <= maxY &&
          isValid(w.pos.row, w.pos.col, span.x, span.y)
        ) {
          const dist = Math.abs(span.x - newX) + Math.abs(span.y - newY);
          if (dist < bestDist) {
            bestDist = dist;
            best = span;
            foundValid = true;
          }
        }
      }

      return { ...best, isValid: foundValid };
    }

    // For free-form, try to find largest valid size
    if (targetIsValid) {
      return { x: newX, y: newY, isValid: true };
    }

    // Fallback: find largest valid in each direction
    let validX = initial.x;
    let validY = initial.y;

    for (let x = initial.x; x <= newX && x <= maxX; x++) {
      if (isValid(w.pos.row, w.pos.col, x, initial.y)) {
        validX = x;
      } else break;
    }

    for (let y = initial.y; y <= newY && y <= maxY; y++) {
      if (isValid(w.pos.row, w.pos.col, initial.x, y)) {
        validY = y;
      } else break;
    }

    if (isValid(w.pos.row, w.pos.col, validX, validY)) {
      return { x: validX, y: validY, isValid: true };
    }

    return { ...initial, isValid: false };
  }

  function smoothTransition(newX: number, newY: number) {
    if (isTransitioning || (newX === currentSpan.x && newY === currentSpan.y))
      return;

    isTransitioning = true;
    const w = getWidget();
    const g = getGrid();

    const currentW = currentSpan.x * g.cellSize + (currentSpan.x - 1) * g.gap;
    const currentH = currentSpan.y * g.cellSize + (currentSpan.y - 1) * g.gap;
    const targetW = newX * g.cellSize + (newX - 1) * g.gap;
    const targetH = newY * g.cellSize + (newY - 1) * g.gap;

    resizedWidget.style.width = `${currentW}px`;
    resizedWidget.style.height = `${currentH}px`;

    const duration = resizeState.type === "resizing" ? "150ms" : "250ms";
    resizedWidget.style.transition = `width ${duration} ease, height ${duration} ease`;

    resizedWidget.style.gridArea = `${w.pos.row} / ${w.pos.col} / ${
      w.pos.row + newY
    } / ${w.pos.col + newX}`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resizedWidget.style.width = `${targetW}px`;
        resizedWidget.style.height = `${targetH}px`;
      });
    });

    setTimeout(
      () => {
        if (resizeState.type !== "resizing") {
          resizedWidget.style.width = "";
          resizedWidget.style.height = "";
          resizedWidget.style.transition = "";
        }
        isTransitioning = false;
      },
      resizeState.type === "resizing" ? 150 : 250,
    );

    currentSpan = { x: newX, y: newY };
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
    if (!pendingEvent || resizeState.type !== "resizing") {
      rafId = null;
      return;
    }

    const e = pendingEvent;
    pendingEvent = null;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;

    const result = getValidSpanFromDelta(deltaX, deltaY);

    if (result.x !== currentSpan.x || result.y !== currentSpan.y) {
      // Visual feedback
      resizedWidget.style.boxShadow = result.isValid
        ? "0 8px 32px rgba(59, 130, 246, 0.2)"
        : "0 8px 32px rgba(239, 68, 68, 0.3)";

      smoothTransition(result.x, result.y);
    }

    rafId = null;
  }

  /* ---------------------------------- */
  /* Lifecycle                          */
  /* ---------------------------------- */

  function startResize(e: MouseEvent) {
    if (!settings.options.isResizable) return;
    if (e.button !== 0 || resizeState.type !== "idle") return;

    e.preventDefault();
    e.stopPropagation();

    const w = getWidget();
    resizeState = {
      type: "resizing",
      startX: e.clientX,
      startY: e.clientY,
      initialSpan: { ...w.span },
    };
    options.onResizeStateChange?.(resizeState);

    currentSpan = { ...w.span };
    updateOccupiedCells();

    resizedWidget.classList.add("resizing");
    resizedWidget.style.zIndex = "1001";
    resizedWidget.style.transform = "scale(1.02)";
    document.body.classList.add("resizing-in-progress");

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (resizeState.type === "resizing") queueMove(e);
  }

  function onMouseUp() {
    if (resizeState.type !== "resizing") return;

    const initial = resizeState.initialSpan;
    const final = currentSpan;

    // Smooth transition back
    resizedWidget.style.transition =
      "transform 0.2s ease, box-shadow 0.2s ease";
    resizedWidget.style.transform = "";
    resizedWidget.style.boxShadow = "";

    setTimeout(() => {
      resizedWidget.classList.remove("resizing");
      if (!isTransitioning) {
        resizedWidget.style.zIndex = "";
        resizedWidget.style.transition = "";
      }
    }, 200);

    // Update store if changed
    if (final.x !== initial.x || final.y !== initial.y) {
      SettingStore.update((s) => {
        s.widgets[options.widgetId].span =
          final as (typeof s.widgets)[typeof options.widgetId]["span"];
        return s;
      });
      options.onResize?.(final);
    }

    cleanup();
  }

  function cancelResize() {
    if (resizeState.type !== "resizing") return;

    resizedWidget.style.transition = "";
    resizedWidget.style.transform = "";
    resizedWidget.style.boxShadow = "";
    resizedWidget.style.width = "";
    resizedWidget.style.height = "";

    cleanup();
  }

  function cleanup() {
    resizeState = { type: "idle" };
    options.onResizeStateChange?.(resizeState);

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    pendingEvent = null;

    document.body.classList.remove("resizing-in-progress");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  /* ---------------------------------- */
  /* Init                               */
  /* ---------------------------------- */

  resizeHandle.addEventListener("mousedown", startResize);

  if (settings.options.isResizable) {
    attachResizeHandle();
  }

  return {
    destroy() {
      cleanup();
      unsubscribe();
      detachResizeHandle();
      resizeHandle.removeEventListener("mousedown", startResize);
    },
  };
}

import settingStore from "../stores/setting.store";

export interface DraggableOptions {
  onDragEnd?: (gridRow: number, gridCol: number) => void;
}

// Track occupied grid cells
const occupiedCells = new Set<string>();

export function draggable(
  element: HTMLElement,
  options: DraggableOptions = {}
) {
  let isDragging = $state(false);
  let isDraggable = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  let placeholder: HTMLElement | null = $state(null);
  let currentPlaceholderPos = $state({ row: 1, col: 1 });
  let lastUpdateX = $state(0);
  let lastUpdateY = $state(0);

  settingStore.subscribe((value) => {
    isDraggable = !value.options.isDraggable;
  });

  function getGridContainer(): HTMLElement | null {
    return element.closest(".widget-container") as HTMLElement;
  }

  function getGridElement(): HTMLElement | null {
    const container = getGridContainer();
    return container?.querySelector(".widget-grid") as HTMLElement;
  }

  function getGridInfo() {
    const gridElement = getGridElement();
    if (!gridElement) return { cols: 6, rows: 4, cellSize: 120, gap: 10 };

    const styles = getComputedStyle(gridElement);
    return {
      cols: parseInt(styles.getPropertyValue("--grid-cols") || "6"),
      rows: parseInt(styles.getPropertyValue("--grid-rows") || "4"),
      cellSize: parseInt(styles.getPropertyValue("--cell-size") || "120"),
      gap: parseInt(styles.getPropertyValue("--grid-gap") || "10"),
    };
  }

  function getElementCurrentGridPosition() {
    const style = getComputedStyle(element);
    const gridArea = style.gridArea;

    if (gridArea && gridArea !== "auto") {
      const parts = gridArea.split(" / ");
      if (parts.length === 4) {
        const startRow = parseInt(parts[0]);
        const startCol = parseInt(parts[1]);

        return { row: startRow, col: startCol };
      }
    }

    return { row: 1, col: 1 };
  }

  function getElementSpan() {
    const style = getComputedStyle(element);
    const gridArea = style.gridArea;

    if (gridArea && gridArea !== "auto") {
      const parts = gridArea.split(" / ");
      if (parts.length === 4) {
        const startRow = parseInt(parts[0]);
        const startCol = parseInt(parts[1]);
        const endRow = parseInt(parts[2]);
        const endCol = parseInt(parts[3]);

        return {
          spanX: endCol - startCol,
          spanY: endRow - startRow,
        };
      }
    }

    return { spanX: 1, spanY: 1 };
  }

  function createPlaceholder() {
    const div = document.createElement("div");
    div.style.cssText = `
      position: fixed;
      background: rgba(255, 255, 255, 0.1);
      border: 2px dashed rgba(255, 255, 255, 0.4);
      border-radius: 20px;
      pointer-events: none;
      z-index: 0;
      backdrop-filter: blur(10px);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(div);
    return div;
  }

  function updateOccupiedCells() {
    occupiedCells.clear();
    const gridElement = getGridElement();
    if (!gridElement) return;

    // Find all widgets in the grid
    const widgets = gridElement.querySelectorAll('[style*="grid-area"]');
    widgets.forEach((widget) => {
      if (widget === element) return; // Skip the currently dragged element

      const style = getComputedStyle(widget);
      const gridArea = style.gridArea;

      if (gridArea && gridArea !== "auto") {
        const parts = gridArea.split(" / ");
        if (parts.length === 4) {
          const startRow = parseInt(parts[0]);
          const startCol = parseInt(parts[1]);
          const endRow = parseInt(parts[2]);
          const endCol = parseInt(parts[3]);

          // Mark all cells occupied by this widget
          for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
              occupiedCells.add(`${row}-${col}`);
            }
          }
        }
      }
    });
  }

  function isPositionValid(
    row: number,
    col: number,
    spanX: number,
    spanY: number
  ) {
    const gridInfo = getGridInfo();

    // Check bounds
    if (
      row < 1 ||
      col < 1 ||
      row + spanY - 1 > gridInfo.rows ||
      col + spanX - 1 > gridInfo.cols
    ) {
      return false;
    }

    // Check for overlaps
    for (let r = row; r < row + spanY; r++) {
      for (let c = col; c < col + spanX; c++) {
        if (occupiedCells.has(`${r}-${c}`)) {
          return false;
        }
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
    const gridInfo = getGridInfo();
    let bestPos = { row: 1, col: 1 };
    let bestDistance = Infinity;

    // Try all possible positions
    for (let row = 1; row <= gridInfo.rows - spanY + 1; row++) {
      for (let col = 1; col <= gridInfo.cols - spanX + 1; col++) {
        if (isPositionValid(row, col, spanX, spanY)) {
          const distance =
            Math.abs(row - targetRow) + Math.abs(col - targetCol);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPos = { row, col };
          }
        }
      }
    }

    return bestPos;
  }

  function getBestSnapPosition(
    widgetX: number,
    widgetY: number,
    spanX: number,
    spanY: number
  ) {
    const gridElement = getGridElement();
    if (!gridElement) return { row: 1, col: 1 };

    const gridRect = gridElement.getBoundingClientRect();
    const gridInfo = getGridInfo();

    // Get widget dimensions
    const widgetWidth = spanX * gridInfo.cellSize + (spanX - 1) * gridInfo.gap;
    const widgetHeight = spanY * gridInfo.cellSize + (spanY - 1) * gridInfo.gap;

    let bestPos = { row: 1, col: 1 };
    let maxOverlap = 0;

    // Get approximate grid position based on widget center for better diagonal handling
    const widgetCenterX = widgetX + widgetWidth / 2;
    const widgetCenterY = widgetY + widgetHeight / 2;
    const centerGridPos = getMouseGridPosition(widgetCenterX, widgetCenterY);

    // Expand search area around the center position to catch diagonal cases
    const searchRadius = Math.max(spanX, spanY) + 1;
    const minRow = Math.max(1, centerGridPos.row - searchRadius);
    const maxRow = Math.min(
      gridInfo.rows - spanY + 1,
      centerGridPos.row + searchRadius
    );
    const minCol = Math.max(1, centerGridPos.col - searchRadius);
    const maxCol = Math.min(
      gridInfo.cols - spanX + 1,
      centerGridPos.col + searchRadius
    );

    // Try all positions in the expanded search area
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isPositionValid(row, col, spanX, spanY)) continue;

        // Calculate grid cell position
        const cellX =
          gridRect.left + (col - 1) * (gridInfo.cellSize + gridInfo.gap);
        const cellY =
          gridRect.top + (row - 1) * (gridInfo.cellSize + gridInfo.gap);
        const cellWidth =
          spanX * gridInfo.cellSize + (spanX - 1) * gridInfo.gap;
        const cellHeight =
          spanY * gridInfo.cellSize + (spanY - 1) * gridInfo.gap;

        // Calculate overlap between widget and this grid position
        const overlapLeft = Math.max(widgetX, cellX);
        const overlapTop = Math.max(widgetY, cellY);
        const overlapRight = Math.min(widgetX + widgetWidth, cellX + cellWidth);
        const overlapBottom = Math.min(
          widgetY + widgetHeight,
          cellY + cellHeight
        );

        // Calculate overlap area
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        const overlapArea = overlapWidth * overlapHeight;

        // Check if this is the best overlap so far
        if (overlapArea > maxOverlap) {
          maxOverlap = overlapArea;
          bestPos = { row, col };
        }
      }
    }

    // Lower the threshold slightly for better diagonal responsiveness
    const widgetArea = widgetWidth * widgetHeight;
    const overlapPercentage = maxOverlap / widgetArea;

    if (overlapPercentage > 0.4) {
      // Reduced from 0.5 to 0.4 for better diagonal sensitivity
      return bestPos;
    }

    // If no good overlap, fall back to nearest position based on widget center
    const mousePos = getMouseGridPosition(widgetCenterX, widgetCenterY);
    return findNearestValidPosition(mousePos.row, mousePos.col, spanX, spanY);
  }

  function getMouseGridPosition(mouseX: number, mouseY: number) {
    const gridElement = getGridElement();
    if (!gridElement) return { row: 1, col: 1 };

    const gridRect = gridElement.getBoundingClientRect();
    const gridInfo = getGridInfo();

    const relativeX = mouseX - gridRect.left;
    const relativeY = mouseY - gridRect.top;

    const col = Math.floor(relativeX / (gridInfo.cellSize + gridInfo.gap)) + 1;
    const row = Math.floor(relativeY / (gridInfo.cellSize + gridInfo.gap)) + 1;

    return {
      row: Math.max(1, Math.min(row, gridInfo.rows)),
      col: Math.max(1, Math.min(col, gridInfo.cols)),
    };
  }

  function getGridCellRect(
    row: number,
    col: number,
    spanX: number = 1,
    spanY: number = 1
  ) {
    const gridElement = getGridElement();
    if (!gridElement) return { x: 0, y: 0, width: 120, height: 120 };

    const gridRect = gridElement.getBoundingClientRect();
    const gridInfo = getGridInfo();

    const x = gridRect.left + (col - 1) * (gridInfo.cellSize + gridInfo.gap);
    const y = gridRect.top + (row - 1) * (gridInfo.cellSize + gridInfo.gap);
    const width = spanX * gridInfo.cellSize + (spanX - 1) * gridInfo.gap;
    const height = spanY * gridInfo.cellSize + (spanY - 1) * gridInfo.gap;

    return { x, y, width, height };
  }

  function updatePlaceholder(
    row: number,
    col: number,
    spanX: number,
    spanY: number
  ) {
    if (!placeholder) return;

    const rect = getGridCellRect(row, col, spanX, spanY);

    // Always update position and size
    placeholder.style.left = `${rect.x}px`;
    placeholder.style.top = `${rect.y}px`;
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.opacity = "1";

    // Update current position tracking
    currentPlaceholderPos = { row, col };
  }

  function handleMouseDown(e: MouseEvent) {
    if (isDraggable || e.button !== 0) return;

    // Check if the event is coming from a resize indicator
    const target = e.target as HTMLElement;
    if (target.closest(".resize-indicator")) {
      return; // Let the resize action handle this
    }

    // Check if the event is coming from an element with data-isolate-drag attribute
    if (target.closest("[data-isolate-drag]")) {
      return; // Don't trigger drag for isolated elements
    }

    e.preventDefault();
    isDragging = true;

    const rect = element.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Initialize last update position
    lastUpdateX = rect.left;
    lastUpdateY = rect.top;

    // Update occupied cells
    updateOccupiedCells();

    // Create placeholder
    placeholder = createPlaceholder();

    // Initialize placeholder position using the widget's current grid position
    const span = getElementSpan();
    const currentPos = getElementCurrentGridPosition();
    currentPlaceholderPos = currentPos;
    updatePlaceholder(currentPos.row, currentPos.col, span.spanX, span.spanY);

    // Style dragged element
    element.style.position = "fixed";
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.zIndex = "1001";
    element.style.pointerEvents = "none";
    element.style.transform = "scale(1.05)";
    element.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
    element.style.transition = "transform 0.2s ease";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleWindowResize);

    document.body.classList.add("dragging");
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    // Move element
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;

    // Update placeholder based on widget overlap with grid cells
    const span = getElementSpan();

    // Calculate where the widget's top-left corner would be
    const widgetTopLeftX = e.clientX - offsetX;
    const widgetTopLeftY = e.clientY - offsetY;

    // Add threshold to reduce snap sensitivity - only update if moved significantly
    const threshold = 8; // pixels - reduced since we have better overlap detection
    const deltaX = Math.abs(widgetTopLeftX - lastUpdateX);
    const deltaY = Math.abs(widgetTopLeftY - lastUpdateY);

    if (deltaX > threshold || deltaY > threshold) {
      // Get the best snap position based on widget overlap
      const validPos = getBestSnapPosition(
        widgetTopLeftX,
        widgetTopLeftY,
        span.spanX,
        span.spanY
      );

      // Only update if the grid position actually changed
      if (
        validPos.row !== currentPlaceholderPos.row ||
        validPos.col !== currentPlaceholderPos.col
      ) {
        updatePlaceholder(validPos.row, validPos.col, span.spanX, span.spanY);
        lastUpdateX = widgetTopLeftX;
        lastUpdateY = widgetTopLeftY;
      }
    }
  }

  function handleWindowResize() {
    if (!isDragging || !placeholder) return;

    // Update placeholder position and size on window resize
    const span = getElementSpan();
    updatePlaceholder(
      currentPlaceholderPos.row,
      currentPlaceholderPos.col,
      span.spanX,
      span.spanY
    );
  }

  function handleMouseUp(e: MouseEvent) {
    if (!isDragging) return;

    const span = getElementSpan();

    // Calculate where the widget's top-left corner would be
    const widgetTopLeftX = e.clientX - offsetX;
    const widgetTopLeftY = e.clientY - offsetY;

    // Get the best snap position based on widget overlap
    const finalPos = getBestSnapPosition(
      widgetTopLeftX,
      widgetTopLeftY,
      span.spanX,
      span.spanY
    );
    const finalRect = getGridCellRect(
      finalPos.row,
      finalPos.col,
      span.spanX,
      span.spanY
    );

    // Animate to final position
    element.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.left = `${finalRect.x}px`;
    element.style.top = `${finalRect.y}px`;
    element.style.transform = "scale(1)";
    element.style.boxShadow = "none";

    // Reset after animation
    setTimeout(() => {
      element.style.position = "";
      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";
      element.style.zIndex = "";
      element.style.pointerEvents = "";
      element.style.transform = "";
      element.style.transition = "";
      element.style.boxShadow = "";
      element.style.gridArea = `${finalPos.row} / ${finalPos.col} / ${
        finalPos.row + span.spanY
      } / ${finalPos.col + span.spanX}`;

      options.onDragEnd?.(finalPos.row, finalPos.col);
    }, 300);

    // Cleanup
    if (placeholder) {
      placeholder.style.opacity = "0";
      setTimeout(() => {
        placeholder?.remove();
        placeholder = null;
      }, 200);
    }

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("resize", handleWindowResize);

    document.body.classList.remove("dragging");
    isDragging = false;
  }

  element.addEventListener("mousedown", handleMouseDown);
  // element.style.cursor = isDraggable ? "default" : "grab";
  // if (isDragging) {
  //   element.classList.add("draggable-widget");
  // } else {
  //   element.classList.remove("draggable-widget");
  // }

  return {
    update(newOptions: DraggableOptions) {
      options = newOptions;
      // element.style.cursor = isDraggable ? "default" : "grab";
      // if (isDragging) {
      //   element.classList.add("draggable-widget");
      // } else {
      //   element.classList.remove("draggable-widget");
      // }
    },
    destroy() {
      element.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleWindowResize);
      placeholder?.remove();
    },
  };
}

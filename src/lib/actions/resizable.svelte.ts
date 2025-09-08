import settingStore from "../stores/settingStore";

export interface ResizableOptions {
  onResize?: (spanX: number, spanY: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  allowedSizes?: string[]; // e.g., ["1x1", "2x2", "3x3"]
}

export function resizable(
  element: HTMLElement,
  options: ResizableOptions = {}
) {
  let isResizing = $state(false);
  let isResizable = $state(false);
  let startX = $state(0);
  let startY = $state(0);
  let initialSpanX = $state(1);
  let initialSpanY = $state(1);
  let resizeIndicator: HTMLElement | null = $state(null);
  let currentSpanX = $state(1);
  let currentSpanY = $state(1);
  let resizeTimeout: number | null = $state(null);
  let lastResizeTime = $state(0);
  let isTransitioning = $state(false);

  settingStore.subscribe((value) => {
    const newResizable = value.options.isResizable;
    const wasResizable = isResizable;
    isResizable = newResizable;
    
    // Update indicator visibility and cursor based on new state
    updateResizableState(wasResizable, newResizable);
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

  function getCurrentSpan() {
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

  function getCurrentPosition() {
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

  function smoothTransitionToSize(newSpanX: number, newSpanY: number) {
    if (
      isTransitioning ||
      (newSpanX === currentSpanX && newSpanY === currentSpanY)
    )
      return;

    isTransitioning = true;
    const position = getCurrentPosition();

    // Get current and target dimensions
    const gridInfo = getGridInfo();
    const currentWidth =
      currentSpanX * gridInfo.cellSize + (currentSpanX - 1) * gridInfo.gap;
    const currentHeight =
      currentSpanY * gridInfo.cellSize + (currentSpanY - 1) * gridInfo.gap;
    const targetWidth =
      newSpanX * gridInfo.cellSize + (newSpanX - 1) * gridInfo.gap;
    const targetHeight =
      newSpanY * gridInfo.cellSize + (newSpanY - 1) * gridInfo.gap;

    // Set explicit dimensions for smooth transition
    element.style.width = `${currentWidth}px`;
    element.style.height = `${currentHeight}px`;

    // Use a faster, more responsive transition for real-time resizing
    const transitionDuration = isResizing ? "150ms" : "250ms";
    // element.style.transition = `width ${transitionDuration} cubic-bezier(.17,.57,.41,.87), height ${transitionDuration} cubic-bezier(.17,.57,.41,.87)`;

    // Update grid area immediately (but dimensions will animate)
    element.style.gridArea = `${position.row} / ${position.col} / ${
      position.row + newSpanY
    } / ${position.col + newSpanX}`;

    // Use double requestAnimationFrame for smooth initial state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.width = `${targetWidth}px`;
        element.style.height = `${targetHeight}px`;
      });
    });

    // Clean up after transition
    const cleanup = () => {
      element.style.width = "";
      element.style.height = "";

      // Only clear transition if we're not currently resizing
      if (!isResizing) {
        element.style.transition = "";
      }

      isTransitioning = false;
    };

    // Use the same duration as the transition
    const cleanupDelay = isResizing ? 150 : 250;
    setTimeout(cleanup, cleanupDelay);

    currentSpanX = newSpanX;
    currentSpanY = newSpanY;
  }

  function updateOccupiedCells() {
    const occupiedCells = new Set<string>();
    const gridElement = getGridElement();
    if (!gridElement) return occupiedCells;

    // Find all widgets in the grid except the current one
    const widgets = gridElement.querySelectorAll('[style*="grid-area"]');
    widgets.forEach((widget) => {
      if (widget === element) return; // Skip the currently resized element

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

    return occupiedCells;
  }

  function isPositionValid(
    row: number,
    col: number,
    spanX: number,
    spanY: number,
    occupiedCells: Set<string>
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

  function isValidSize(spanX: number, spanY: number): boolean {
    if (!options.allowedSizes) return true;

    const sizeString = `${spanX}x${spanY}`;
    return options.allowedSizes.includes(sizeString);
  }

  function getValidSizeFromMovement(
    deltaX: number,
    deltaY: number
  ): { spanX: number; spanY: number; isValid: boolean } {
    const gridInfo = getGridInfo();
    const position = getCurrentPosition();
    const occupiedCells = updateOccupiedCells();

    // Calculate how many cells we've moved
    const cellsMovedX = Math.round(deltaX / (gridInfo.cellSize + gridInfo.gap));
    const cellsMovedY = Math.round(deltaY / (gridInfo.cellSize + gridInfo.gap));

    // Calculate new span
    let newSpanX = Math.max(1, initialSpanX + cellsMovedX);
    let newSpanY = Math.max(1, initialSpanY + cellsMovedY);

    // Ensure we don't go beyond grid boundaries
    const maxSpanX = gridInfo.cols - position.col + 1;
    const maxSpanY = gridInfo.rows - position.row + 1;

    newSpanX = Math.min(newSpanX, maxSpanX);
    newSpanY = Math.min(newSpanY, maxSpanY);

    // Check if the target size would be valid
    const targetIsValid = isPositionValid(
      position.row,
      position.col,
      newSpanX,
      newSpanY,
      occupiedCells
    );

    // If allowedSizes is specified, find the closest valid size that doesn't collide
    if (options.allowedSizes) {
      let bestSize = { spanX: initialSpanX, spanY: initialSpanY }; // Fallback to initial size
      let bestDistance = Infinity;
      let foundValid = false;

      for (const sizeStr of options.allowedSizes) {
        const [x, y] = sizeStr.split("x").map(Number);
        if (
          x <= maxSpanX &&
          y <= maxSpanY &&
          isPositionValid(position.row, position.col, x, y, occupiedCells)
        ) {
          const distance = Math.abs(x - newSpanX) + Math.abs(y - newSpanY);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSize = { spanX: x, spanY: y };
            foundValid = true;
          }
        }
      }

      return { ...bestSize, isValid: foundValid };
    }

    // For free-form sizing, check if the calculated size would collide
    if (targetIsValid) {
      return { spanX: newSpanX, spanY: newSpanY, isValid: true };
    }

    // If it would collide, try to find the largest valid size in that direction
    let validSpanX = initialSpanX;
    let validSpanY = initialSpanY;
    let foundValidSize = false;

    // Try increasing X while keeping Y constant
    for (let x = initialSpanX; x <= newSpanX && x <= maxSpanX; x++) {
      if (
        isPositionValid(
          position.row,
          position.col,
          x,
          initialSpanY,
          occupiedCells
        )
      ) {
        validSpanX = x;
        foundValidSize = true;
      } else {
        break;
      }
    }

    // Try increasing Y while keeping X constant
    for (let y = initialSpanY; y <= newSpanY && y <= maxSpanY; y++) {
      if (
        isPositionValid(
          position.row,
          position.col,
          initialSpanX,
          y,
          occupiedCells
        )
      ) {
        validSpanY = y;
        foundValidSize = true;
      } else {
        break;
      }
    }

    // Try both directions together if individual directions worked
    if (
      foundValidSize &&
      isPositionValid(
        position.row,
        position.col,
        validSpanX,
        validSpanY,
        occupiedCells
      )
    ) {
      return { spanX: validSpanX, spanY: validSpanY, isValid: true };
    }

    return { spanX: initialSpanX, spanY: initialSpanY, isValid: false }; // Fallback to original size
  }

  function createResizeIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "resize-indicator";

    // Create the SVG elements using DOM methods
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "19");
    svg.setAttribute("height", "19");
    svg.setAttribute("viewBox", "0 0 23 23");
    svg.setAttribute("fill", "none");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 20C14.3626 20 19.6777 14.3333 20 3");
    path.setAttribute("stroke", "#D6D6D6");
    path.setAttribute("stroke-width", "6");
    path.setAttribute("stroke-linecap", "round");

    svg.appendChild(path);
    indicator.appendChild(svg);

    indicator.style.cssText = `
      bottom: 5px;
      right: 5px;
      width: 19px;
      height: 19px;
      opacity: 0;
      z-index: 10;
      cursor: nw-resize;
      position: absolute;
      pointer-events: all;
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    return indicator;
  }

  function showIndicator() {
    if (!resizeIndicator || !isResizable || isResizing) return;
    // Small delay to ensure smooth transition
    requestAnimationFrame(() => {
      if (resizeIndicator) {
        resizeIndicator.style.opacity = "1";
      }
    });
  }

  function hideIndicator() {
    if (!resizeIndicator || !isResizable || isResizing) return;
    resizeIndicator.style.opacity = "0";
  }

  function handleMouseDown(e: MouseEvent) {
    if (!isResizable || e.button !== 0) return; // Left click only

    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    const span = getCurrentSpan();
    initialSpanX = span.spanX;
    initialSpanY = span.spanY;
    currentSpanX = span.spanX;
    currentSpanY = span.spanY;

    // Call onResizeStart callback
    if (options.onResizeStart) {
      options.onResizeStart();
    }

    // Add visual feedback and faster transition class for smooth resizing
    element.classList.add("resizing");
    element.style.zIndex = "1001";
    element.style.transform = "scale(1.02)";
    element.style.boxShadow = "0 8px 32px rgba(59, 130, 246, 0.2)";
    document.body.classList.add("resizing");

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.classList.add("resizing");
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isResizing) return;

    // Use more responsive throttling for smoother resizing
    const now = performance.now();
    if (now - lastResizeTime < 16) return; // ~60fps for smooth experience
    lastResizeTime = now;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const result = getValidSizeFromMovement(deltaX, deltaY);

    if (result.spanX !== currentSpanX || result.spanY !== currentSpanY) {
      // Visual feedback for invalid resize attempts
      if (!result.isValid) {
        element.style.boxShadow = "0 8px 32px rgba(239, 68, 68, 0.3)";
      } else {
        element.style.boxShadow = "0 8px 32px rgba(59, 130, 246, 0.2)";
      }

      // Use requestAnimationFrame for smooth visual updates
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }

      resizeTimeout = requestAnimationFrame(() => {
        smoothTransitionToSize(result.spanX, result.spanY);
        resizeTimeout = null;
      });
    }
  }

  function handleMouseUp() {
    if (!isResizing) return;

    isResizing = false;

    // Clear any pending resize updates
    if (resizeTimeout) {
      cancelAnimationFrame(resizeTimeout);
      resizeTimeout = null;
    }

    // Remove the resizing class to switch back to slower transitions
    element.classList.remove("resizing");

    // Add smooth transition back to normal state
    // element.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease';
    element.style.transform = "";
    element.style.boxShadow = "";

    // Reset after transition, but don't interfere with size transitions
    setTimeout(() => {
      if (!isTransitioning) {
        element.style.zIndex = "";
        element.style.transition = "";
      }
    }, 200);

    document.body.classList.remove("resizing");

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.classList.remove("resizing");

    // Call the callback with the new size
    if (
      options.onResize &&
      (currentSpanX !== initialSpanX || currentSpanY !== initialSpanY)
    ) {
      options.onResize(currentSpanX, currentSpanY);
    }

    // Call onResizeEnd callback
    if (options.onResizeEnd) {
      options.onResizeEnd();
    }
  }

  function updateResizableState(wasResizable: boolean, newResizable: boolean) {
    if (newResizable && !wasResizable) {
      // Enable resize - show indicator and set cursor
      if (!resizeIndicator) {
        element.style.position = "relative";
        resizeIndicator = createResizeIndicator();
        element.appendChild(resizeIndicator);
        element.addEventListener("mouseenter", showIndicator);
        element.addEventListener("mouseleave", hideIndicator);
        resizeIndicator.addEventListener("mousedown", handleMouseDown);
      }
    } else if (!newResizable && wasResizable) {
      // Disable resize - remove indicator and reset cursor
      if (resizeIndicator) {
        resizeIndicator.remove();
        resizeIndicator = null;
      }
      element.removeEventListener("mouseenter", showIndicator);
      element.removeEventListener("mouseleave", hideIndicator);
    }
  }

  // Initialize
  if (isResizable) {
    element.style.position = "relative";

    resizeIndicator = createResizeIndicator();
    element.appendChild(resizeIndicator);

    // Add event listeners
    element.addEventListener("mouseenter", showIndicator);
    element.addEventListener("mouseleave", hideIndicator);
    resizeIndicator.addEventListener("mousedown", handleMouseDown);
  }

  return {
    update(newOptions: ResizableOptions) {
      options = newOptions;
      // Note: The resizable state is managed by the settingStore subscription
      // so we don't need to handle state changes here anymore
    },

    destroy() {
      if (resizeIndicator) {
        resizeIndicator.remove();
      }
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }

      // Clean up any ongoing transitions and classes
      element.classList.remove("resizing");
      element.style.width = "";
      element.style.height = "";
      element.style.transition = "";
      element.style.transform = "";
      element.style.boxShadow = "";
      element.style.zIndex = "";

      element.removeEventListener("mouseenter", showIndicator);
      element.removeEventListener("mouseleave", hideIndicator);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("resizing");
    },
  };
}

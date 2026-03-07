import { get } from "svelte/store";
import { SettingStore } from "../../settings/settings.store";

/**
 * Mental model:
 * - Right-click in edit mode triggers flip animation
 * - Widget flips left-to-right to center of screen
 * - Shows back view (slot or callback content)
 * - Click outside flips right-to-left back to original position
 */

type FlipState =
  | { type: "front" }
  | {
      type: "flipped";
      originalRect: DOMRect;
      originalGridArea: string;
      originalZIndex: string;
      originalPosition: string;
      originalTransition: string;
    };

export function flippable(
  element: HTMLElement,
  options: {
    widgetId: string;
    isDemo?: boolean;
    onFlip?: (element: HTMLElement) => void;
    onFlipBack?: (element: HTMLElement) => void;
  },
) {
  // If demo mode, do nothing
  if (options.isDemo) {
    return {
      destroy() {},
    };
  }

  let flipState: FlipState = { type: "front" };

  let settings = get(SettingStore);
  const unsubscribe = SettingStore.subscribe((v) => {
    settings = v;

    // If draggable mode is disabled while flipped, flip back
    if (!v.options.isDraggable && flipState.type === "flipped") {
      flipBack();
    }
  });

  /* ---------------------------------- */
  /* Click Outside Handler              */
  /* ---------------------------------- */

  function handleClickOutside(event: MouseEvent) {
    // Check if click is outside the entire flipped element
    if (!element.contains(event.target as Node)) {
      flipBack();
    }
  }

  function setupClickOutside() {
    // Small delay to prevent immediate triggering from the right-click event
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
  }

  function removeClickOutside() {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  /* ---------------------------------- */
  /* Flip to back view                  */
  /* ---------------------------------- */

  function flipToBack(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Only allow flipping in edit mode
    if (!settings.options.isDraggable) return;
    if (flipState.type === "flipped") return;

    // Store original position and styling
    const originalRect = element.getBoundingClientRect();
    const originalGridArea = element.style.gridArea;
    const originalZIndex = element.style.zIndex || "";
    const originalPosition = element.style.position || "";
    const originalTransition = element.style.transition || "";

    flipState = {
      type: "flipped",
      originalRect,
      originalGridArea,
      originalZIndex,
      originalPosition,
      originalTransition,
    };

    // Calculate center of viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Get the back view dimensions dynamically from the element
    const backViewElement = element.querySelector(".widget-back-face") as HTMLElement;
    const backViewSize = backViewElement ? 
      parseInt(getComputedStyle(backViewElement).width) || 500 : 
      500;

    // Add flipping class and set up transform
    element.classList.add("flipping-to-back");
    element.style.position = "fixed";
    element.style.left = `${originalRect.left}px`;
    element.style.top = `${originalRect.top}px`;
    element.style.width = `${originalRect.width}px`;
    element.style.height = `${originalRect.height}px`;
    element.style.minWidth = `${originalRect.width}px`;
    element.style.minHeight = `${originalRect.height}px`;
    element.style.maxWidth = `${originalRect.width}px`;
    element.style.maxHeight = `${originalRect.height}px`;
    element.style.zIndex = "1002";
    element.style.transition = "all 0.5s ease-in-out";

    // Trigger reflow
    element.offsetHeight;

    // Move to center, expand to back view size, and flip
    element.style.left = `${centerX - backViewSize / 2}px`;
    element.style.top = `${centerY - backViewSize / 2}px`;
    element.style.width = `${backViewSize}px`;
    element.style.height = `${backViewSize}px`;
    element.style.minWidth = `${backViewSize}px`;
    element.style.minHeight = `${backViewSize}px`;
    element.style.maxWidth = `${backViewSize}px`;
    element.style.maxHeight = `${backViewSize}px`;
    element.style.transform = "rotateY(180deg)";

    // Immediately add flipped class and data attribute to show back view during animation
    element.classList.add("flipped");
    element.setAttribute("data-flipped", "true");

    // After animation completes, finalize
    setTimeout(() => {
      element.classList.remove("flipping-to-back");

      // Override backface-visibility AFTER the animation so the flip looks correct.
      // Some browsers evaluate backface-visibility:hidden against the element's LOCAL
      // transform (rotateY(180deg)) rather than the accumulated transform (0deg net),
      // causing the back-view to be non-interactive even when facing the viewer.
      const backView = element.querySelector(
        ".widget-back-face",
      ) as HTMLElement | null;
      if (backView) {
        backView.style.backfaceVisibility = "visible";
        backView.style.pointerEvents = "auto";
      }

      // Call onFlip callback if provided
      if (options.onFlip) {
        options.onFlip(element);
      }

      // Set up click outside listener
      setupClickOutside();
    }, 500);
  }

  /* ---------------------------------- */
  /* Flip back to front view            */
  /* ---------------------------------- */

  function flipBack() {
    if (flipState.type !== "flipped") return;

    const {
      originalRect,
      originalGridArea,
      originalZIndex,
      originalPosition,
      originalTransition,
    } = flipState;

    // Restore backface-visibility BEFORE the animation so the flip-back renders correctly
    // (back-view should hide itself mid-animation as it rotates away from the viewer)
    const backView = element.querySelector(
      ".widget-back-face",
    ) as HTMLElement | null;
    if (backView) {
      backView.style.backfaceVisibility = "";
      backView.style.pointerEvents = "";
    }

    // Remove click outside listener
    removeClickOutside();

    // Start flip back animation (keep flipped class for now)
    element.classList.add("flipping-to-front");
    element.style.transition = "all 0.5s ease-in-out";

    // Trigger reflow
    element.offsetHeight;

    // Move back to original position and flip
    element.style.left = `${originalRect.left}px`;
    element.style.top = `${originalRect.top}px`;
    element.style.width = `${originalRect.width}px`;
    element.style.height = `${originalRect.height}px`;
    element.style.minWidth = `${originalRect.width}px`;
    element.style.minHeight = `${originalRect.height}px`;
    element.style.maxWidth = `${originalRect.width}px`;
    element.style.maxHeight = `${originalRect.height}px`;
    element.style.transform = "rotateY(0deg) scale(1)";

    // Remove flipped class halfway through animation to show front view
    setTimeout(() => {
      element.classList.remove("flipped");
    }, 250);

    // After animation completes, restore original state
    setTimeout(() => {
      element.classList.remove("flipping-to-front");

      element.style.position = originalPosition;
      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";
      element.style.minWidth = "";
      element.style.minHeight = "";
      element.style.maxWidth = "";
      element.style.maxHeight = "";
      element.style.zIndex = originalZIndex;
      element.style.transform = "";
      element.style.transition = originalTransition;
      element.style.gridArea = originalGridArea;
      element.removeAttribute("data-flipped");

      // Call onFlipBack callback if provided
      if (options.onFlipBack) {
        options.onFlipBack(element);
      }

      flipState = { type: "front" };
    }, 500);
  }

  /* ---------------------------------- */
  /* Event listeners                    */
  /* ---------------------------------- */

  function handleContextMenu(e: MouseEvent) {
    // Prevent default context menu
    if (settings.options.isDraggable) {
      flipToBack(e);
    }
  }

  element.addEventListener("contextmenu", handleContextMenu);

  /* ---------------------------------- */
  /* Cleanup                            */
  /* ---------------------------------- */

  return {
    destroy() {
      removeClickOutside();
      element.removeEventListener("contextmenu", handleContextMenu);
      unsubscribe();
    },
  };
}

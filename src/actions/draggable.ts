import widgetStore from "$stores/WidgetStore";
import { get } from "svelte/store";

export default function draggable(node: HTMLElement): void {
  let isDragging = false;
  const isReordering = get(widgetStore).options.reordering;
  const widgetData = get(widgetStore).widgets[node.id];

  let offsetX = widgetData.x || 0;
  let offsetY = widgetData.y || 0;
  let startX = 0;
  let startY = 0;

  node.style.position = "absolute";
  node.style.left = `${widgetData.x}px`;
  node.style.top = `${widgetData.y}px`;
  
  if (isReordering === false) return;

  function handleMouseDown(event: MouseEvent): void {
    isDragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;

    node.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent): void {
    if (!isDragging) return;

    // node.style.cursor = "grab";
    const x = event.clientX - startX;
    const y = event.clientY - startY;

    const gridSize = 20; // Change this value to adjust the grid size
    const parent = node.parentElement;

    if (parent) {
      const parentRect = parent.getBoundingClientRect();

      const snappedX = Math.max(
        Math.min(
          Math.round(x / gridSize) * gridSize,
          parentRect.width - node.offsetWidth
        ),
        0
      );

      const snappedY = Math.max(
        Math.min(
          Math.round(y / gridSize) * gridSize,
          parentRect.height - node.offsetHeight
        ),
        0
      );

      node.style.left = `${snappedX}px`;
      node.style.top = `${snappedY}px`;

      // Update the widget store
      widgetStore.update((value) => {
        value.widgets[node.id].x = snappedX;
        value.widgets[node.id].y = snappedY;
        return value;
      });
    }
  }

  function handleMouseUp(event: MouseEvent): void {
    isDragging = false;
    node.style.cursor = "default";
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  node.addEventListener("mousedown", handleMouseDown);
  node.classList.add("draggable");
}

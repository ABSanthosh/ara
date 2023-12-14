export default function draggable(node: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;

  node.style.position = "absolute";
  node.style.cursor = "grab";

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

    const x = event.clientX - startX;
    const y = event.clientY - startY;

    const gridSize = 20; // Change this value to adjust the grid size

    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    // node.style.transform = `translate(${snappedX}px, ${snappedY}px)`;
    node.style.left = `${snappedX}px`;
    node.style.top = `${snappedY}px`;
  }

  function handleMouseUp(event: MouseEvent): void {
    isDragging = false;
    node.style.cursor = "grab";
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  node.addEventListener("mousedown", handleMouseDown);
  node.classList.add('draggable');
}

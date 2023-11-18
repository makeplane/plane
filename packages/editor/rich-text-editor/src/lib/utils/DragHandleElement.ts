export function createDragHandleElement(): HTMLElement {
  let dragHandleElement = document.createElement("div");
  dragHandleElement.draggable = true;
  dragHandleElement.dataset.dragHandle = "";
  dragHandleElement.classList.add("drag-handle");

  const dragHandleContainer = document.createElement("div");
  dragHandleContainer.classList.add("drag-handle-container");
  dragHandleElement.appendChild(dragHandleContainer);

  const dotsContainer = document.createElement("div");
  dotsContainer.classList.add("drag-handle-dots");

  for (let i = 0; i < 6; i++) {
    const spanElement = document.createElement("span");
    spanElement.classList.add("drag-handle-dot");
    dotsContainer.appendChild(spanElement);
  }

  dragHandleContainer.appendChild(dotsContainer);

  return dragHandleElement;
}

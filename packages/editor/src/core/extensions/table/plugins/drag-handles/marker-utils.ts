export const DROP_MARKER_CLASS = "table-drop-marker";
export const COL_DRAG_MARKER_CLASS = "table-col-drag-marker";
export const ROW_DRAG_MARKER_CLASS = "table-row-drag-marker";

export const DROP_MARKER_THICKNESS = 2;

export const getDropMarker = (tableElement: HTMLElement): HTMLElement | null =>
  tableElement.querySelector(`.${DROP_MARKER_CLASS}`);

export const hideDropMarker = (element: HTMLElement): void => {
  if (!element.classList.contains("hidden")) {
    element.classList.add("hidden");
  }
};

export const updateColDropMarker = ({
  element,
  left,
  width,
}: {
  element: HTMLElement;
  left: number;
  width: number;
}) => {
  element.style.height = "100%";
  element.style.width = `${width}px`;
  element.style.top = "0";
  element.style.left = `${left}px`;
  element.classList.remove("hidden");
};

export const updateRowDropMarker = ({
  element,
  top,
  height,
}: {
  element: HTMLElement;
  top: number;
  height: number;
}) => {
  element.style.width = "100%";
  element.style.height = `${height}px`;
  element.style.left = "0";
  element.style.top = `${top}px`;
  element.classList.remove("hidden");
};

export const getColDragMarker = (tableElement: HTMLElement): HTMLElement | null =>
  tableElement.querySelector(`.${COL_DRAG_MARKER_CLASS}`);

export const getRowDragMarker = (tableElement: HTMLElement): HTMLElement | null =>
  tableElement.querySelector(`.${ROW_DRAG_MARKER_CLASS}`);

export const hideDragMarker = (element: HTMLElement): void => {
  if (!element.classList.contains("hidden")) {
    element.classList.add("hidden");
  }
};

export const updateColDragMarker = ({
  element,
  left,
  width,
  pseudoColumn,
}: {
  element: HTMLElement;
  left: number;
  width: number;
  pseudoColumn: HTMLElement | undefined;
}) => {
  element.style.left = `${left}px`;
  element.style.width = `${width}px`;
  element.classList.remove("hidden");
  if (pseudoColumn) {
    /// clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    // clone and append the pseudo column
    element.appendChild(pseudoColumn.cloneNode(true));
  }
};

export const updateRowDragMarker = ({
  element,
  top,
  height,
  pseudoRow,
}: {
  element: HTMLElement;
  top: number;
  height: number;
  pseudoRow: HTMLElement | undefined;
}) => {
  element.style.top = `${top}px`;
  element.style.height = `${height}px`;
  element.classList.remove("hidden");
  if (pseudoRow) {
    /// clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    // clone and append the pseudo row
    element.appendChild(pseudoRow.cloneNode(true));
  }
};

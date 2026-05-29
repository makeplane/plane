import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { addColumn, removeColumn, addRow, removeRow, TableMap } from "@tiptap/pm/tables";
import type { TableRect } from "@tiptap/pm/tables";
// local imports
import { isCellEmpty } from "../../table/utilities/helpers";

const addSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path
  d="M8.5 7.49988V3.49988C8.5 3.22374 8.27614 2.99988 8 2.99988C7.72386 2.99988 7.5 3.22374 7.5 3.49988L7.5 7.49988L3.5 7.49988C3.22386 7.49988 3 7.72374 3 7.99988C3 8.27602 3.22386 8.49988 3.5 8.49988H7.5L7.5 12.4999C7.5 12.776 7.72386 12.9999 8 12.9999C8.27614 12.9999 8.5 12.776 8.5 12.4999L8.5 8.49988L12.5 8.49988C12.7761 8.49988 13 8.27602 13 7.99988C13 7.72374 12.7761 7.49988 12.5 7.49988L8.5 7.49988Z"
  fill="currentColor"
/>
</svg>`;

export type TableInfo = {
  tableElement: HTMLElement;
  tableNode: ProseMirrorNode;
  tablePos: number;
  columnButtonElement?: HTMLElement;
  rowButtonElement?: HTMLElement;
  dragMarkerContainerElement?: HTMLElement;
};

export const createColumnInsertButton = (editor: Editor, tableInfo: TableInfo): HTMLElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "table-column-insert-button";
  button.title = "Insert columns";
  button.ariaLabel = "Insert columns";

  const icon = document.createElement("span");
  icon.innerHTML = addSvg;
  button.appendChild(icon);

  let mouseDownX = 0;
  let isDragging = false;
  let dragStarted = false;
  let lastActionX = 0;
  const DRAG_THRESHOLD = 5; // pixels to start drag
  const ACTION_THRESHOLD = 150; // pixels total distance to trigger action

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    mouseDownX = e.clientX;
    lastActionX = e.clientX;
    isDragging = false;
    dragStarted = false;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - mouseDownX;
    const distance = Math.abs(deltaX);

    // Start dragging if moved more than threshold
    if (!isDragging && distance > DRAG_THRESHOLD) {
      isDragging = true;
      dragStarted = true;

      // Visual feedback
      button.classList.add("dragging");
      document.body.style.userSelect = "none";
    }

    if (isDragging) {
      const totalDistance = Math.abs(e.clientX - lastActionX);

      // Only trigger action when total distance reaches threshold
      if (totalDistance >= ACTION_THRESHOLD) {
        // Determine direction based on current movement relative to last action point
        const directionFromLastAction = e.clientX - lastActionX;

        // Right direction - add columns
        if (directionFromLastAction > 0) {
          insertColumnAfterLast(editor, tableInfo);
          lastActionX = e.clientX; // Reset action point
        }
        // Left direction - delete empty columns
        else if (directionFromLastAction < 0) {
          const deleted = removeLastColumn(editor, tableInfo);
          if (deleted) {
            lastActionX = e.clientX; // Reset action point
          }
        }
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (isDragging) {
      // Clean up drag state
      button.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (!dragStarted) {
      // Handle as click if no dragging occurred
      insertColumnAfterLast(editor, tableInfo);
    }

    isDragging = false;
    dragStarted = false;
  };

  button.addEventListener("mousedown", onMouseDown);

  // Prevent context menu and text selection
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("selectstart", (e) => e.preventDefault());

  return button;
};

export const createRowInsertButton = (editor: Editor, tableInfo: TableInfo): HTMLElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "table-row-insert-button";
  button.title = "Insert rows";
  button.ariaLabel = "Insert rows";

  const icon = document.createElement("span");
  icon.innerHTML = addSvg;
  button.appendChild(icon);

  let mouseDownY = 0;
  let isDragging = false;
  let dragStarted = false;
  let lastActionY = 0;
  const DRAG_THRESHOLD = 5; // pixels to start drag
  const ACTION_THRESHOLD = 40; // pixels total distance to trigger action

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    e.preventDefault();
    e.stopPropagation();

    mouseDownY = e.clientY;
    lastActionY = e.clientY;
    isDragging = false;
    dragStarted = false;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - mouseDownY;
    const distance = Math.abs(deltaY);

    // Start dragging if moved more than threshold
    if (!isDragging && distance > DRAG_THRESHOLD) {
      isDragging = true;
      dragStarted = true;

      // Visual feedback
      button.classList.add("dragging");
      document.body.style.userSelect = "none";
    }

    if (isDragging) {
      const totalDistance = Math.abs(e.clientY - lastActionY);

      // Only trigger action when total distance reaches threshold
      if (totalDistance >= ACTION_THRESHOLD) {
        // Determine direction based on current movement relative to last action point
        const directionFromLastAction = e.clientY - lastActionY;

        // Down direction - add rows
        if (directionFromLastAction > 0) {
          insertRowAfterLast(editor, tableInfo);
          lastActionY = e.clientY; // Reset action point
        }
        // Up direction - delete empty rows
        else if (directionFromLastAction < 0) {
          const deleted = removeLastRow(editor, tableInfo);
          if (deleted) {
            lastActionY = e.clientY; // Reset action point
          }
        }
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (isDragging) {
      // Clean up drag state
      button.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (!dragStarted) {
      // Handle as click if no dragging occurred
      insertRowAfterLast(editor, tableInfo);
    }

    isDragging = false;
    dragStarted = false;
  };

  button.addEventListener("mousedown", onMouseDown);

  // Prevent context menu and text selection
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("selectstart", (e) => e.preventDefault());

  return button;
};

export const findAllTables = (editor: Editor): TableInfo[] => {
  const tables: TableInfo[] = [];
  const tableElements = editor.view.dom.querySelectorAll("table");

  tableElements.forEach((tableElement) => {
    // Find the table's ProseMirror position
    let tablePos = -1;
    let tableNode: ProseMirrorNode | null = null;

    // Walk through the document to find matching table nodes
    editor.state.doc.descendants((node, pos) => {
      if (node.type.spec.tableRole === "table") {
        const domAtPos = editor.view.domAtPos(pos + 1);
        let domTable = domAtPos.node;

        // Navigate to find the table element
        while (domTable && domTable.parentNode && domTable.nodeType !== Node.ELEMENT_NODE) {
          domTable = domTable.parentNode;
        }

        while (domTable && domTable.parentNode && (domTable as HTMLElement).tagName !== "TABLE") {
          domTable = domTable.parentNode;
        }

        if (domTable === tableElement) {
          tablePos = pos;
          tableNode = node;
          return false; // Stop iteration
        }
      }
    });

    if (tablePos !== -1 && tableNode) {
      tables.push({
        tableElement,
        tableNode,
        tablePos,
      });
    }
  });

  return tables;
};

const getCurrentTableInfo = (editor: Editor, tableInfo: TableInfo): TableInfo => {
  // Refresh table info to get latest state
  const tables = findAllTables(editor);
  const updated = tables.find((t) => t.tableElement === tableInfo.tableElement);
  return updated || tableInfo;
};

// Column functions
const insertColumnAfterLast = (editor: Editor, tableInfo: TableInfo) => {
  const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
  const { tableNode, tablePos } = currentTableInfo;
  const tableMapData = TableMap.get(tableNode);
  const lastColumnIndex = tableMapData.width;

  const tr = editor.state.tr;
  const rect: TableRect = {
    map: tableMapData,
    tableStart: tablePos,
    table: tableNode,
    top: 0,
    left: 0,
    bottom: tableMapData.height - 1,
    right: tableMapData.width - 1,
  };

  const newTr = addColumn(tr, rect, lastColumnIndex);
  editor.view.dispatch(newTr);
};

const removeLastColumn = (editor: Editor, tableInfo: TableInfo): boolean => {
  const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
  const { tableNode, tablePos } = currentTableInfo;
  const tableMapData = TableMap.get(tableNode);

  // Don't delete if only one column left
  if (tableMapData.width <= 1) {
    return false;
  }

  const lastColumnIndex = tableMapData.width - 1;

  // Check if last column is empty
  if (!isColumnEmpty(currentTableInfo, lastColumnIndex)) {
    return false;
  }

  const tr = editor.state.tr;
  const rect = {
    map: tableMapData,
    tableStart: tablePos,
    table: tableNode,
    top: 0,
    left: 0,
    bottom: tableMapData.height - 1,
    right: tableMapData.width - 1,
  };

  removeColumn(tr, rect, lastColumnIndex);
  editor.view.dispatch(tr);
  return true;
};

const isColumnEmpty = (tableInfo: TableInfo, columnIndex: number): boolean => {
  const { tableNode } = tableInfo;
  const tableMapData = TableMap.get(tableNode);

  // Check each cell in the column
  for (let row = 0; row < tableMapData.height; row++) {
    const cellIndex = row * tableMapData.width + columnIndex;
    const cellPos = tableMapData.map[cellIndex];
    const cell = tableNode.nodeAt(cellPos);

    if (!isCellEmpty(cell)) {
      return false;
    }
  }
  return true;
};

// Row functions
const insertRowAfterLast = (editor: Editor, tableInfo: TableInfo) => {
  const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
  const { tableNode, tablePos } = currentTableInfo;
  const tableMapData = TableMap.get(tableNode);
  const lastRowIndex = tableMapData.height;

  const tr = editor.state.tr;
  const rect: TableRect = {
    map: tableMapData,
    tableStart: tablePos,
    table: tableNode,
    top: 0,
    left: 0,
    bottom: tableMapData.height - 1,
    right: tableMapData.width - 1,
  };

  const newTr = addRow(tr, rect, lastRowIndex);
  editor.view.dispatch(newTr);
};

const removeLastRow = (editor: Editor, tableInfo: TableInfo): boolean => {
  const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
  const { tableNode, tablePos } = currentTableInfo;
  const tableMapData = TableMap.get(tableNode);

  // Don't delete if only one row left
  if (tableMapData.height <= 1) {
    return false;
  }

  const lastRowIndex = tableMapData.height - 1;

  // Check if last row is empty
  if (!isRowEmpty(currentTableInfo, lastRowIndex)) {
    return false;
  }

  const tr = editor.state.tr;
  const rect = {
    map: tableMapData,
    tableStart: tablePos,
    table: tableNode,
    top: 0,
    left: 0,
    bottom: tableMapData.height - 1,
    right: tableMapData.width - 1,
  };

  removeRow(tr, rect, lastRowIndex);
  editor.view.dispatch(tr);
  return true;
};

const isRowEmpty = (tableInfo: TableInfo, rowIndex: number): boolean => {
  const { tableNode } = tableInfo;
  const tableMapData = TableMap.get(tableNode);

  // Check each cell in the row
  for (let col = 0; col < tableMapData.width; col++) {
    const cellIndex = rowIndex * tableMapData.width + col;
    const cellPos = tableMapData.map[cellIndex];
    const cell = tableNode.nodeAt(cellPos);

    if (!isCellEmpty(cell)) {
      return false;
    }
  }
  return true;
};

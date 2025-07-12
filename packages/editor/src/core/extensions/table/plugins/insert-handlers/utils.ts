import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { addColumn, removeColumn, addRow, removeRow, TableMap } from "@tiptap/pm/tables";

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
  let columnsAdded = 0;
  let originalColumnCount = 0; // Track original column count at drag start
  const DRAG_THRESHOLD = 5;
  const ACTION_THRESHOLD = 150;

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    mouseDownX = e.clientX;
    isDragging = false;
    dragStarted = false;

    // Initialize with existing column count
    const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
    const tableMapData = TableMap.get(currentTableInfo.tableNode);
    originalColumnCount = tableMapData.width;
    columnsAdded = originalColumnCount; // Current total columns

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - mouseDownX;
    const distance = Math.abs(deltaX);

    if (!isDragging && distance > DRAG_THRESHOLD) {
      isDragging = true;
      dragStarted = true;
      button.classList.add("dragging");
      document.body.style.userSelect = "none";
    }

    if (isDragging) {
      // Calculate target columns based on displacement from start position
      let targetColumns = originalColumnCount; // Start with original count

      if (deltaX > 0) {
        // Moving right - add columns based on distance
        let columnsToAdd = 0;
        while (columnsToAdd * ACTION_THRESHOLD + ACTION_THRESHOLD / 2 <= deltaX) {
          columnsToAdd++;
        }
        targetColumns = originalColumnCount + columnsToAdd;
      } else if (deltaX < 0) {
        // Moving left - remove columns based on distance
        const leftDistance = Math.abs(deltaX);
        let columnsToRemove = 0;
        while (columnsToRemove * ACTION_THRESHOLD + ACTION_THRESHOLD / 2 <= leftDistance) {
          columnsToRemove++;
        }
        targetColumns = Math.max(1, originalColumnCount - columnsToRemove); // Keep at least 1 column
      }

      // Add columns if needed
      while (columnsAdded < targetColumns) {
        insertColumnAfterLast(editor, tableInfo);
        columnsAdded++;
      }

      // Remove columns if needed
      while (columnsAdded > targetColumns) {
        const deleted = removeLastColumn(editor, tableInfo);
        if (deleted) {
          columnsAdded--;
        } else {
          break;
        }
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (isDragging) {
      button.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (!dragStarted) {
      insertColumnAfterLast(editor, tableInfo);
      columnsAdded++;
    }

    isDragging = false;
    dragStarted = false;
    // Don't reset columnsAdded and originalColumnCount here - they'll be reset on next drag
  };

  button.addEventListener("mousedown", onMouseDown);
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
  let rowsAdded = 0;
  let originalRowCount = 0; // Track original row count at drag start
  const DRAG_THRESHOLD = 5;
  const ACTION_THRESHOLD = 40;

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    mouseDownY = e.clientY;
    isDragging = false;
    dragStarted = false;

    // Initialize with existing row count
    const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
    const tableMapData = TableMap.get(currentTableInfo.tableNode);
    originalRowCount = tableMapData.height;
    rowsAdded = originalRowCount; // Current total rows

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - mouseDownY;
    const distance = Math.abs(deltaY);

    if (!isDragging && distance > DRAG_THRESHOLD) {
      isDragging = true;
      dragStarted = true;
      button.classList.add("dragging");
      document.body.style.userSelect = "none";
    }

    if (isDragging) {
      // Calculate target rows based on displacement from start position
      let targetRows = originalRowCount; // Start with original count

      if (deltaY > 0) {
        // Moving down - add rows based on distance
        let rowsToAdd = 0;
        while (rowsToAdd * ACTION_THRESHOLD + ACTION_THRESHOLD / 2 <= deltaY) {
          rowsToAdd++;
        }
        targetRows = originalRowCount + rowsToAdd;
      } else if (deltaY < 0) {
        // Moving up - remove rows based on distance
        const upDistance = Math.abs(deltaY);
        let rowsToRemove = 0;
        while (rowsToRemove * ACTION_THRESHOLD + ACTION_THRESHOLD / 2 <= upDistance) {
          rowsToRemove++;
        }
        targetRows = Math.max(1, originalRowCount - rowsToRemove); // Keep at least 1 row
      }

      // Add rows if needed
      while (rowsAdded < targetRows) {
        insertRowAfterLast(editor, tableInfo);
        rowsAdded++;
      }

      // Remove rows if needed
      while (rowsAdded > targetRows) {
        const deleted = removeLastRow(editor, tableInfo);
        if (deleted) {
          rowsAdded--;
        } else {
          break;
        }
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (isDragging) {
      button.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (!dragStarted) {
      insertRowAfterLast(editor, tableInfo);
      rowsAdded++;
    }

    isDragging = false;
    dragStarted = false;
    // Don't reset rowsAdded and originalRowCount here - they'll be reset on next drag
  };

  button.addEventListener("mousedown", onMouseDown);
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
  const rect = {
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

// Helper function to check if a single cell is empty
const isCellEmpty = (cell: ProseMirrorNode | null | undefined): boolean => {
  if (!cell || cell.content.size === 0) {
    return true;
  }

  // Check if cell has any non-empty content
  let hasContent = false;
  cell.content.forEach((node) => {
    if (node.type.name === "paragraph") {
      if (node.content.size > 0) {
        hasContent = true;
      }
    } else if (node.content.size > 0 || node.isText) {
      hasContent = true;
    }
  });

  return !hasContent;
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
  const rect = {
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

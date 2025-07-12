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

  if (tableMapData.width <= 1) {
    return false;
  }

  const lastColumnIndex = tableMapData.width - 1;

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

  if (tableMapData.height <= 1) {
    return false;
  }

  const lastRowIndex = tableMapData.height - 1;

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

// Helper functions
const isCellEmpty = (cell: ProseMirrorNode | null | undefined): boolean => {
  if (!cell || cell.content.size === 0) {
    return true;
  }

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

const isRowEmpty = (tableInfo: TableInfo, rowIndex: number): boolean => {
  const { tableNode } = tableInfo;
  const tableMapData = TableMap.get(tableNode);

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

type InsertDirection = "column" | "row";

interface InsertButtonConfig {
  direction: InsertDirection;
  className: string;
  title: string;
  ariaLabel: string;
  dragThreshold: number;
  actionThreshold: number;
  coordinate: "clientX" | "clientY";
}

interface DragState {
  mouseDownPosition: number;
  isDragging: boolean;
  dragStarted: boolean;
  itemsAdded: number;
  originalItemCount: number;
}

interface InsertHandlers {
  insertItem: (editor: Editor, tableInfo: TableInfo) => void;
  removeItem: (editor: Editor, tableInfo: TableInfo) => boolean;
  getItemCount: (tableNode: ProseMirrorNode) => number;
  isEmpty: (tableInfo: TableInfo, itemIndex: number) => boolean;
}

// Column handlers
const columnHandlers: InsertHandlers = {
  insertItem: insertColumnAfterLast,
  removeItem: removeLastColumn,
  getItemCount: (tableNode) => TableMap.get(tableNode).width,
  isEmpty: isColumnEmpty,
};

// Row handlers
const rowHandlers: InsertHandlers = {
  insertItem: insertRowAfterLast,
  removeItem: removeLastRow,
  getItemCount: (tableNode) => TableMap.get(tableNode).height,
  isEmpty: isRowEmpty,
};

// Configuration for different button types
const BUTTON_CONFIGS: Record<InsertDirection, InsertButtonConfig> = {
  column: {
    direction: "column",
    className: "table-column-insert-button",
    title: "Insert columns",
    ariaLabel: "Insert columns",
    dragThreshold: 5,
    actionThreshold: 150,
    coordinate: "clientX",
  },
  row: {
    direction: "row",
    className: "table-row-insert-button",
    title: "Insert rows",
    ariaLabel: "Insert rows",
    dragThreshold: 5,
    actionThreshold: 40,
    coordinate: "clientY",
  },
};

const createInsertButton = (
  editor: Editor,
  tableInfo: TableInfo,
  config: InsertButtonConfig,
  handlers: InsertHandlers
): HTMLElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = config.className;
  button.title = config.title;
  button.ariaLabel = config.ariaLabel;

  const icon = document.createElement("span");
  icon.innerHTML = addSvg;
  button.appendChild(icon);

  const dragState: DragState = {
    mouseDownPosition: 0,
    isDragging: false,
    dragStarted: false,
    itemsAdded: 0,
    originalItemCount: 0,
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    dragState.mouseDownPosition = e[config.coordinate];
    dragState.isDragging = false;
    dragState.dragStarted = false;

    // Initialize with existing item count
    const currentTableInfo = getCurrentTableInfo(editor, tableInfo);
    dragState.originalItemCount = handlers.getItemCount(currentTableInfo.tableNode);
    dragState.itemsAdded = dragState.originalItemCount;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const delta = e[config.coordinate] - dragState.mouseDownPosition;
    const distance = Math.abs(delta);

    if (!dragState.isDragging && distance > config.dragThreshold) {
      dragState.isDragging = true;
      dragState.dragStarted = true;
      button.classList.add("dragging");
      document.body.style.userSelect = "none";
    }

    if (dragState.isDragging) {
      const targetItems = calculateTargetItems(delta, dragState.originalItemCount, config.actionThreshold);

      // Add items if needed
      while (dragState.itemsAdded < targetItems) {
        handlers.insertItem(editor, tableInfo);
        dragState.itemsAdded++;
      }

      // Remove items if needed
      while (dragState.itemsAdded > targetItems) {
        const deleted = handlers.removeItem(editor, tableInfo);
        if (deleted) {
          dragState.itemsAdded--;
        } else {
          break;
        }
      }
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (dragState.isDragging) {
      button.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    } else if (!dragState.dragStarted) {
      handlers.insertItem(editor, tableInfo);
      dragState.itemsAdded++;
    }

    dragState.isDragging = false;
    dragState.dragStarted = false;
  };

  button.addEventListener("mousedown", onMouseDown);
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("selectstart", (e) => e.preventDefault());

  return button;
};

const calculateTargetItems = (delta: number, originalCount: number, actionThreshold: number): number => {
  let targetItems = originalCount;

  if (delta > 0) {
    // Moving in positive direction - add items
    let itemsToAdd = 0;
    while (itemsToAdd * actionThreshold + actionThreshold / 2 <= delta) {
      itemsToAdd++;
    }
    targetItems = originalCount + itemsToAdd;
  } else if (delta < 0) {
    // Moving in negative direction - remove items
    const distance = Math.abs(delta);
    let itemsToRemove = 0;
    while (itemsToRemove * actionThreshold + actionThreshold / 2 <= distance) {
      itemsToRemove++;
    }
    targetItems = Math.max(1, originalCount - itemsToRemove);
  }

  return targetItems;
};

export const createColumnInsertButton = (editor: Editor, tableInfo: TableInfo): HTMLElement =>
  createInsertButton(editor, tableInfo, BUTTON_CONFIGS.column, columnHandlers);

export const createRowInsertButton = (editor: Editor, tableInfo: TableInfo): HTMLElement =>
  createInsertButton(editor, tableInfo, BUTTON_CONFIGS.row, rowHandlers);

export const findAllTables = (editor: Editor): TableInfo[] => {
  const tables: TableInfo[] = [];
  const tableElements = editor.view.dom.querySelectorAll("table");

  tableElements.forEach((tableElement) => {
    let tablePos = -1;
    let tableNode: ProseMirrorNode | null = null;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.spec.tableRole === "table") {
        const domAtPos = editor.view.domAtPos(pos + 1);
        let domTable = domAtPos.node;

        while (domTable && domTable.parentNode && domTable.nodeType !== Node.ELEMENT_NODE) {
          domTable = domTable.parentNode;
        }

        while (domTable && domTable.parentNode && (domTable as HTMLElement).tagName !== "TABLE") {
          domTable = domTable.parentNode;
        }

        if (domTable === tableElement) {
          tablePos = pos;
          tableNode = node;
          return false;
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
  const tables = findAllTables(editor);
  const updated = tables.find((t) => t.tableElement === tableInfo.tableElement);
  return updated || tableInfo;
};

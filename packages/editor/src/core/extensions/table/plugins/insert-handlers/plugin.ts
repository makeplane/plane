import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// local imports
import { COL_DRAG_MARKER_CLASS, DROP_MARKER_CLASS, ROW_DRAG_MARKER_CLASS } from "../drag-handles/marker-utils";
import type { TableInfo } from "./utils";
import { createColumnInsertButton, createRowInsertButton, findAllTables } from "./utils";

const TABLE_INSERT_PLUGIN_KEY = new PluginKey("table-insert");

export const TableInsertPlugin = (editor: Editor): Plugin => {
  const tableMap = new Map<HTMLElement, TableInfo>();

  const setupTable = (tableInfo: TableInfo) => {
    const { tableElement } = tableInfo;

    // Create and add column button if it doesn't exist
    if (!tableInfo.columnButtonElement) {
      const columnButton = createColumnInsertButton(editor, tableInfo);
      tableElement.appendChild(columnButton);
      tableInfo.columnButtonElement = columnButton;
    }

    // Create and add row button if it doesn't exist
    if (!tableInfo.rowButtonElement) {
      const rowButton = createRowInsertButton(editor, tableInfo);
      tableElement.appendChild(rowButton);
      tableInfo.rowButtonElement = rowButton;
    }

    // Create and add drag marker if it doesn't exist
    if (!tableInfo.dragMarkerContainerElement) {
      const dragMarker = createMarkerContainer();
      tableElement.appendChild(dragMarker);
      tableInfo.dragMarkerContainerElement = dragMarker;
    }

    tableMap.set(tableElement, tableInfo);
  };

  const cleanupTable = (tableElement: HTMLElement) => {
    const tableInfo = tableMap.get(tableElement);
    tableInfo?.columnButtonElement?.remove();
    tableInfo?.rowButtonElement?.remove();
    tableInfo?.dragMarkerContainerElement?.remove();
    tableMap.delete(tableElement);
  };

  const updateAllTables = () => {
    if (!editor.isEditable) {
      // Clean up all tables if editor is not editable
      tableMap.forEach((_, tableElement) => {
        cleanupTable(tableElement);
      });
      return;
    }

    const currentTables = findAllTables(editor);
    const currentTableElements = new Set(currentTables.map((t) => t.tableElement));

    // Remove buttons from tables that no longer exist
    tableMap.forEach((_, tableElement) => {
      if (!currentTableElements.has(tableElement)) {
        cleanupTable(tableElement);
      }
    });

    // Add buttons to new tables
    currentTables.forEach((tableInfo) => {
      if (!tableMap.has(tableInfo.tableElement)) {
        setupTable(tableInfo);
      }
    });
  };

  return new Plugin({
    key: TABLE_INSERT_PLUGIN_KEY,

    view() {
      setTimeout(updateAllTables, 0);

      return {
        update(view, prevState) {
          // Update when document changes
          if (!prevState.doc.eq(view.state.doc)) {
            updateAllTables();
          }
        },
        destroy() {
          // Clean up all tables
          tableMap.forEach((_, tableElement) => {
            cleanupTable(tableElement);
          });
          tableMap.clear();
        },
      };
    },
  });
};

const createMarkerContainer = (): HTMLElement => {
  const el = document.createElement("div");
  el.className = "table-drag-marker-container";
  el.contentEditable = "false";
  el.appendChild(createDropMarker());
  el.appendChild(createColDragMarker());
  el.appendChild(createRowDragMarker());
  return el;
};

const createDropMarker = (): HTMLElement => {
  const el = document.createElement("div");
  el.className = DROP_MARKER_CLASS;
  return el;
};

const createColDragMarker = (): HTMLElement => {
  const el = document.createElement("div");
  el.className = `${COL_DRAG_MARKER_CLASS} hidden`;

  return el;
};

const createRowDragMarker = (): HTMLElement => {
  const el = document.createElement("div");
  el.className = `${ROW_DRAG_MARKER_CLASS} hidden`;

  return el;
};

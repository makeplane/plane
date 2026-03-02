/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ParentConfig } from "@tiptap/core";
import { callOrReturn, getExtensionField, mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  columnResizing,
  deleteCellSelection,
  deleteTable,
  fixTables,
  goToNextCell,
  mergeCells,
  setCellAttr,
  splitCell,
  tableEditing,
  TableMap,
  toggleHeader,
  toggleHeaderCell,
} from "@tiptap/pm/tables";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { TableDragStatePlugin } from "../plugins/drag-state";
import { TableColumnDragHandlePlugin } from "../plugins/drag-handles/column/plugin";
import { TableRowDragHandlePlugin } from "../plugins/drag-handles/row/plugin";
import { TableInsertPlugin } from "../plugins/insert-handlers/plugin";
import { TableView } from "./table-view";
import { createTable } from "./utilities/create-table";
import { deleteColumnOrTable } from "./utilities/delete-column";
import { handleDeleteKeyOnTable } from "./utilities/delete-key-shortcut";
import { deleteRowOrTable } from "./utilities/delete-row";
import { findTable } from "./utilities/helpers";
import { insertLineAboveTableAction } from "./utilities/insert-line-above-table-action";
import { insertLineBelowTableAction } from "./utilities/insert-line-below-table-action";
import { DEFAULT_COLUMN_WIDTH } from ".";

type TableOptions = {
  HTMLAttributes: Record<string, unknown>;
  resizable: boolean;
  handleWidth: number;
  cellMinWidth: number;
  lastColumnResizable: boolean;
  allowTableNodeSelection: boolean;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.TABLE]: {
      insertTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
      addColumnBefore: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteColumn: () => ReturnType;
      addRowBefore: () => ReturnType;
      addRowAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteTable: () => ReturnType;
      mergeCells: () => ReturnType;
      splitCell: () => ReturnType;
      toggleHeaderColumn: () => ReturnType;
      toggleHeaderRow: () => ReturnType;
      toggleHeaderCell: () => ReturnType;
      clearSelectedCells: () => ReturnType;
      mergeOrSplit: () => ReturnType;
      setCellAttribute: (name: string, value: unknown) => ReturnType;
      goToNextCell: () => ReturnType;
      goToPreviousCell: () => ReturnType;
      fixTables: () => ReturnType;
      setCellSelection: (position: { anchorCell: number; headCell?: number }) => ReturnType;
      setTableToFullWidth: () => ReturnType;
      equalizeColumns: () => ReturnType;
      fitColumnsToText: () => ReturnType;
    };
  }

  interface NodeConfig<Options, Storage> {
    tableRole?:
      | string
      | ((this: {
          name: string;
          options: Options;
          storage: Storage;
          parent: ParentConfig<NodeConfig<Options>>["tableRole"];
        }) => string);
  }
}

export const Table = Node.create<TableOptions>({
  name: CORE_EXTENSIONS.TABLE,

  addOptions() {
    return {
      HTMLAttributes: {},
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    };
  },

  content: "tableRow+",

  tableRole: "table",

  isolating: true,

  group: "block",

  allowGapCursor: false,

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["tbody", 0]];
  },

  // @ts-expect-error commands are not typed
  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = false } = {}) =>
        ({ tr, dispatch, editor }) => {
          const node = createTable({
            schema: editor.schema,
            rowsCount: rows,
            colsCount: cols,
            withHeaderRow,
            columnWidth: DEFAULT_COLUMN_WIDTH,
          });
          if (dispatch) {
            const { selection } = tr;
            const position = selection.$from.before(selection.$from.depth);

            // Delete any existing content at the current position if it's an empty paragraph
            const nodeAfter = tr.doc.nodeAt(position);
            if (nodeAfter && nodeAfter.type.name === "paragraph" && nodeAfter.content.size === 0) {
              tr.delete(position, position + nodeAfter.nodeSize);
            }

            // Insert the table
            tr.insert(position, node);

            // Find the position of the first cell's content
            const resolvedPos = tr.doc.resolve(position + 1);
            const firstCell = resolvedPos.nodeAfter;
            if (firstCell) {
              const cellPos = position + 1;
              tr.setSelection(TextSelection.create(tr.doc, cellPos + 1)).scrollIntoView();
            }

            return true;
          }
        },
      addColumnBefore:
        () =>
        ({ state, dispatch }) =>
          addColumnBefore(state, dispatch),
      addColumnAfter:
        () =>
        ({ state, dispatch }) =>
          addColumnAfter(state, dispatch),
      deleteColumn: deleteColumnOrTable,
      addRowBefore:
        () =>
        ({ state, dispatch }) =>
          addRowBefore(state, dispatch),
      addRowAfter:
        () =>
        ({ state, dispatch }) =>
          addRowAfter(state, dispatch),
      deleteRow: deleteRowOrTable,
      deleteTable:
        () =>
        ({ state, dispatch }) =>
          deleteTable(state, dispatch),
      mergeCells:
        () =>
        ({ state, dispatch }) =>
          mergeCells(state, dispatch),
      splitCell:
        () =>
        ({ state, dispatch }) =>
          splitCell(state, dispatch),
      toggleHeaderColumn:
        () =>
        ({ state, dispatch }) =>
          toggleHeader("column")(state, dispatch),
      toggleHeaderRow:
        () =>
        ({ state, dispatch }) =>
          toggleHeader("row")(state, dispatch),
      toggleHeaderCell:
        () =>
        ({ state, dispatch }) =>
          toggleHeaderCell(state, dispatch),
      clearSelectedCells:
        () =>
        ({ state, dispatch }) =>
          deleteCellSelection(state, dispatch),
      mergeOrSplit:
        () =>
        ({ state, dispatch }) => {
          if (mergeCells(state, dispatch)) {
            return true;
          }

          return splitCell(state, dispatch);
        },
      setCellAttribute:
        (name, value) =>
        ({ state, dispatch }) =>
          setCellAttr(name, value)(state, dispatch),
      goToNextCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(1)(state, dispatch),
      goToPreviousCell:
        () =>
        ({ state, dispatch }) =>
          goToNextCell(-1)(state, dispatch),
      fixTables:
        () =>
        ({ state, dispatch }) => {
          if (dispatch) {
            fixTables(state);
          }

          return true;
        },
      setCellSelection:
        (position) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            const selection = CellSelection.create(tr.doc, position.anchorCell, position.headCell);
            tr.setSelection(selection);
          }
          return true;
        },
      setTableToFullWidth:
        () =>
        ({ state, dispatch, editor }) => {
          const table = findTable(state.selection);
          if (!table) return false;

          // Get content width from CSS variable or calculate from editor container
          const editorContainer = editor.view.dom.closest(".editor-container");
          if (!editorContainer) return false;

          const contentWidthVar = getComputedStyle(editorContainer).getPropertyValue("--editor-content-width").trim();

          let contentWidth: number;

          // Check if CSS variable exists and is a pixel value (not percentage or empty)
          if (contentWidthVar) {
            contentWidth = parseInt(contentWidthVar);
          } else {
            // Fallback: use the actual container width minus padding
            const containerWidth = editorContainer.clientWidth;
            const computedStyle = getComputedStyle(editorContainer);
            const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
            const paddingRight = parseInt(computedStyle.paddingRight) || 0;
            contentWidth = containerWidth - paddingLeft - paddingRight;
          }

          if (isNaN(contentWidth) || contentWidth <= 0) return false;

          // Calculate equal width for each column
          const map = TableMap.get(table.node);
          const equalWidth = Math.floor(contentWidth / map.width);

          if (dispatch) {
            const tr = state.tr;
            const visited = new Set<number>();

            for (let row = 0; row < map.height; row++) {
              for (let col = 0; col < map.width; col++) {
                const cellIndex = row * map.width + col;
                const cellPos = map.map[cellIndex];

                // Skip if cell already updated (for merged cells)
                if (visited.has(cellPos)) continue;

                const cell = table.node.nodeAt(cellPos);
                if (cell) {
                  // Handle colspan for merged cells
                  const colspan = (cell.attrs.colspan as number | undefined) ?? 1;
                  const pos = table.start + cellPos;
                  tr.setNodeMarkup(pos, null, {
                    ...cell.attrs,
                    colwidth: Array(colspan).fill(equalWidth),
                  });

                  visited.add(cellPos);
                }
              }
            }

            dispatch(tr);
          }
          return true;
        },
      equalizeColumns:
        () =>
        ({ state, dispatch }) => {
          const table = findTable(state.selection);
          if (!table) return false;

          const map = TableMap.get(table.node);
          if (!map || map.width === 0) return false;

          // Calculate total width from first row cells
          let totalWidth = 0;
          for (let col = 0; col < map.width; col++) {
            const cellPos = map.map[col];
            const cell = table.node.nodeAt(cellPos);
            if (cell) {
              const colwidth = cell.attrs.colwidth as number[] | null;
              totalWidth += colwidth ? colwidth[0] : DEFAULT_COLUMN_WIDTH;
            }
          }

          const equalWidth = Math.max(100, Math.floor(totalWidth / map.width));

          if (dispatch) {
            const tr = state.tr;
            const visited = new Set<number>();
            for (let row = 0; row < map.height; row++) {
              for (let col = 0; col < map.width; col++) {
                const cellPos = map.map[row * map.width + col];
                if (visited.has(cellPos)) continue;
                visited.add(cellPos);
                const cell = table.node.nodeAt(cellPos);
                if (cell) {
                  const pos = table.start + cellPos;
                  tr.setNodeMarkup(pos, undefined, {
                    ...cell.attrs,
                    colwidth: [equalWidth],
                  });
                }
              }
            }
            dispatch(tr);
          }
          return true;
        },
      fitColumnsToText:
        () =>
        ({ state, dispatch, editor }) => {
          const table = findTable(state.selection);
          if (!table) return false;

          const map = TableMap.get(table.node);
          if (!map || map.width === 0) return false;

          // Measure the natural (unwrapped) content width for each column
          const columnWidths: number[] = Array.from<number>({ length: map.width }).fill(0);

          // Create an off-screen measurement container inside the table's wrapper
          // so that scoped CSS rules (e.g. .table-wrapper table td) still apply to cloned cells
          const tableDOM = editor.view.nodeDOM(table.pos);
          const tableWrapper =
            tableDOM instanceof HTMLElement ? (tableDOM.closest(".table-wrapper") ?? tableDOM.parentElement) : null;
          const measureContainer = document.createElement("div");
          measureContainer.style.cssText =
            "position:absolute;top:-9999px;left:-9999px;visibility:hidden;white-space:nowrap;width:auto;pointer-events:none;";
          (tableWrapper ?? document.body).appendChild(measureContainer);

          for (let col = 0; col < map.width; col++) {
            for (let row = 0; row < map.height; row++) {
              const cellPos = map.map[row * map.width + col];
              try {
                const domAtPos = editor.view.domAtPos(table.start + cellPos + 1);
                const cellElement = domAtPos.node;
                if (cellElement instanceof HTMLElement) {
                  // Build a minimal table structure so the cloned cell gets proper table-cell rendering
                  const wrapTable = document.createElement("table");
                  wrapTable.style.cssText = "width:auto;border-collapse:collapse;table-layout:auto;";
                  const wrapTbody = document.createElement("tbody");
                  const wrapTr = document.createElement("tr");
                  const clone = cellElement.cloneNode(true) as HTMLElement;
                  // Force nowrap on the cell and all descendants
                  clone.style.whiteSpace = "nowrap";
                  clone.style.width = "auto";
                  clone.querySelectorAll("*").forEach((el) => {
                    if (el instanceof HTMLElement) {
                      el.style.whiteSpace = "nowrap";
                      el.style.width = "auto";
                      el.style.minWidth = "0";
                      el.style.maxWidth = "none";
                    }
                  });
                  wrapTr.appendChild(clone);
                  wrapTbody.appendChild(wrapTr);
                  wrapTable.appendChild(wrapTbody);
                  measureContainer.appendChild(wrapTable);
                  const measuredWidth = Math.ceil(clone.getBoundingClientRect().width);
                  columnWidths[col] = Math.max(columnWidths[col], measuredWidth);
                  measureContainer.removeChild(wrapTable);
                }
              } catch {
                // If DOM measurement fails, keep current width
                const cell = table.node.nodeAt(cellPos);
                if (cell) {
                  const currentWidth = (cell.attrs.colwidth as number[] | null)?.[0] ?? DEFAULT_COLUMN_WIDTH;
                  columnWidths[col] = Math.max(columnWidths[col], currentWidth);
                }
              }
            }
            // Enforce minimum width
            columnWidths[col] = Math.max(100, columnWidths[col]);
          }

          measureContainer.remove();

          if (dispatch) {
            const tr = state.tr;
            const visited = new Set<number>();
            for (let row = 0; row < map.height; row++) {
              for (let col = 0; col < map.width; col++) {
                const cellPos = map.map[row * map.width + col];
                if (visited.has(cellPos)) continue;
                visited.add(cellPos);
                const cell = table.node.nodeAt(cellPos);
                if (cell) {
                  const pos = table.start + cellPos;
                  tr.setNodeMarkup(pos, undefined, {
                    ...cell.attrs,
                    colwidth: [columnWidths[col]],
                  });
                }
              }
            }
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive(CORE_EXTENSIONS.TABLE)) return false;

        if (this.editor.isActive(CORE_EXTENSIONS.LIST_ITEM) || this.editor.isActive(CORE_EXTENSIONS.TASK_ITEM)) {
          return false;
        }

        if (this.editor.commands.goToNextCell()) {
          return true;
        }

        if (!this.editor.can().addRowAfter()) {
          return false;
        }

        return this.editor.chain().addRowAfter().goToNextCell().run();
      },
      "Shift-Tab": () => {
        if (!this.editor.isActive(CORE_EXTENSIONS.TABLE)) return false;

        if (this.editor.isActive(CORE_EXTENSIONS.LIST_ITEM) || this.editor.isActive(CORE_EXTENSIONS.TASK_ITEM)) {
          return false;
        }

        return this.editor.commands.goToPreviousCell();
      },
      Backspace: handleDeleteKeyOnTable,
      "Mod-Backspace": handleDeleteKeyOnTable,
      Delete: handleDeleteKeyOnTable,
      "Mod-Delete": handleDeleteKeyOnTable,
      ArrowDown: insertLineBelowTableAction,
      ArrowUp: insertLineAboveTableAction,
    };
  },

  addNodeView() {
    return ({ editor, node, decorations, getPos }) => {
      const { cellMinWidth } = this.options;

      return new TableView(node, cellMinWidth, decorations, editor, getPos);
    };
  },

  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable;

    const plugins = [
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
      TableDragStatePlugin,
      TableInsertPlugin(this.editor),
      TableColumnDragHandlePlugin(this.editor),
      TableRowDragHandlePlugin(this.editor),
    ];

    if (isResizable) {
      plugins.unshift(
        columnResizing({
          handleWidth: this.options.handleWidth,
          cellMinWidth: this.options.cellMinWidth,
          // View: TableView,
          lastColumnResizable: this.options.lastColumnResizable,
        })
      );
    }

    return plugins;
  },

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options as Record<string, unknown>,
      storage: extension.storage as Record<string, unknown>,
    };

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      tableRole: callOrReturn(getExtensionField(extension, "tableRole", context)),
    };
  },
});

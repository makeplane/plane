import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
// extensions
import {
  findTable,
  getTableCellWidgetDecorationPos,
  haveTableRelatedChanges,
} from "@/extensions/table/table/utilities/helpers";
// local imports
import { createRowDragHandle } from "./drag-handle-vanilla";

type DragHandleInstance = {
  element: HTMLElement;
  destroy: () => void;
};

type TableRowDragHandlePluginState = {
  decorations?: DecorationSet;
  // track table structure to detect changes
  tableHeight?: number;
  tableNodePos?: number;
  // track drag handle instances for cleanup
  dragHandles?: DragHandleInstance[];
};

const TABLE_ROW_DRAG_HANDLE_PLUGIN_KEY = new PluginKey("tableRowDragHandlePlugin");

export const TableRowDragHandlePlugin = (editor: Editor): Plugin<TableRowDragHandlePluginState> =>
  new Plugin<TableRowDragHandlePluginState>({
    key: TABLE_ROW_DRAG_HANDLE_PLUGIN_KEY,
    state: {
      init: () => ({}),
      apply(tr, prev, oldState, newState) {
        const table = findTable(newState.selection);
        if (!haveTableRelatedChanges(editor, table, oldState, newState, tr)) {
          return table !== undefined ? prev : {};
        }

        const tableMap = TableMap.get(table.node);

        // Check if table structure changed (height or position)
        const tableStructureChanged = prev.tableHeight !== tableMap.height || prev.tableNodePos !== table.pos;

        let isStale = tableStructureChanged;

        // Only do position-based stale check if structure hasn't changed
        if (!isStale) {
          const mapped = prev.decorations?.map(tr.mapping, tr.doc);
          for (let row = 0; row < tableMap.height; row++) {
            const pos = getTableCellWidgetDecorationPos(table, tableMap, row * tableMap.width);
            if (mapped?.find(pos, pos + 1)?.length !== 1) {
              isStale = true;
              break;
            }
          }
        }

        if (!isStale) {
          const mapped = prev.decorations?.map(tr.mapping, tr.doc);
          return {
            decorations: mapped,
            tableHeight: tableMap.height,
            tableNodePos: table.pos,
            dragHandles: prev.dragHandles,
          };
        }

        // Clean up old drag handles before creating new ones
        prev.dragHandles?.forEach((handle) => {
          try {
            handle.destroy();
          } catch (error) {
            console.error("Error destroying drag handle:", error);
          }
        });

        // recreate all decorations
        const decorations: Decoration[] = [];
        const dragHandles: DragHandleInstance[] = [];

        for (let row = 0; row < tableMap.height; row++) {
          const pos = getTableCellWidgetDecorationPos(table, tableMap, row * tableMap.width);

          const dragHandle = createRowDragHandle({
            editor,
            row,
          });

          dragHandles.push(dragHandle);
          decorations.push(Decoration.widget(pos, () => dragHandle.element));
        }

        return {
          decorations: DecorationSet.create(newState.doc, decorations),
          tableHeight: tableMap.height,
          tableNodePos: table.pos,
          dragHandles,
        };
      },
    },
    props: {
      decorations(state) {
        return (TABLE_ROW_DRAG_HANDLE_PLUGIN_KEY.getState(state) as TableRowDragHandlePluginState | undefined)
          ?.decorations;
      },
    },
    destroy() {
      // Clean up all drag handles when plugin is destroyed
      const state =
        editor.state &&
        (TABLE_ROW_DRAG_HANDLE_PLUGIN_KEY.getState(editor.state) as TableRowDragHandlePluginState | undefined);
      state?.dragHandles?.forEach((handle: DragHandleInstance) => {
        try {
          handle.destroy();
        } catch (error) {
          console.error("Error destroying drag handle:", error);
        }
      });
    },
  });

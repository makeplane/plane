import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ReactRenderer } from "@tiptap/react";
// extensions
import {
  findTable,
  getTableCellWidgetDecorationPos,
  haveTableRelatedChanges,
} from "@/extensions/table/table/utilities/helpers";
// local imports
import type { ColumnDragHandleProps } from "./drag-handle";
import { ColumnDragHandle } from "./drag-handle";

type TableColumnDragHandlePluginState = {
  decorations?: DecorationSet;
  // track table structure to detect changes
  tableWidth?: number;
  tableNodePos?: number;
  // track renderers for cleanup
  renderers?: ReactRenderer[];
};

const TABLE_COLUMN_DRAG_HANDLE_PLUGIN_KEY = new PluginKey("tableColumnHandlerDecorationPlugin");

export const TableColumnDragHandlePlugin = (editor: Editor): Plugin<TableColumnDragHandlePluginState> =>
  new Plugin<TableColumnDragHandlePluginState>({
    key: TABLE_COLUMN_DRAG_HANDLE_PLUGIN_KEY,
    state: {
      init: () => ({}),
      apply(tr, prev, oldState, newState) {
        const table = findTable(newState.selection);
        if (!haveTableRelatedChanges(editor, table, oldState, newState, tr)) {
          return table !== undefined ? prev : {};
        }

        const tableMap = TableMap.get(table.node);

        // Check if table structure changed (width or position)
        const tableStructureChanged = prev.tableWidth !== tableMap.width || prev.tableNodePos !== table.pos;

        let isStale = tableStructureChanged;

        // Only do position-based stale check if structure hasn't changed
        if (!isStale) {
          const mapped = prev.decorations?.map(tr.mapping, tr.doc);
          for (let col = 0; col < tableMap.width; col++) {
            const pos = getTableCellWidgetDecorationPos(table, tableMap, col);
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
            tableWidth: tableMap.width,
            tableNodePos: table.pos,
            renderers: prev.renderers,
          };
        }

        // Clean up old renderers before creating new ones
        prev.renderers?.forEach((renderer) => {
          try {
            renderer.destroy();
          } catch (error) {
            console.error("Error destroying renderer:", error);
          }
        });

        // recreate all decorations
        const decorations: Decoration[] = [];
        const renderers: ReactRenderer[] = [];

        for (let col = 0; col < tableMap.width; col++) {
          const pos = getTableCellWidgetDecorationPos(table, tableMap, col);

          const dragHandleComponent = new ReactRenderer(ColumnDragHandle, {
            props: {
              col,
              editor,
            } satisfies ColumnDragHandleProps,
            editor,
          });

          renderers.push(dragHandleComponent);
          decorations.push(Decoration.widget(pos, () => dragHandleComponent.element));
        }

        return {
          decorations: DecorationSet.create(newState.doc, decorations),
          tableWidth: tableMap.width,
          tableNodePos: table.pos,
          renderers,
        };
      },
    },
    props: {
      decorations(state) {
        return (TABLE_COLUMN_DRAG_HANDLE_PLUGIN_KEY.getState(state) as TableColumnDragHandlePluginState | undefined)
          ?.decorations;
      },
    },
    destroy() {
      // Clean up all renderers when plugin is destroyed
      const state =
        editor.state &&
        (TABLE_COLUMN_DRAG_HANDLE_PLUGIN_KEY.getState(editor.state) as TableColumnDragHandlePluginState | undefined);
      state?.renderers?.forEach((renderer: ReactRenderer) => {
        try {
          renderer.destroy();
        } catch (error) {
          console.error("Error destroying renderer:", error);
        }
      });
    },
  });

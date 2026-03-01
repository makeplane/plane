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

import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
import type { DragHandleInstance } from "../helpers/create-drag-handle";
import { createColumnDragHandle } from "../helpers/create-drag-handle";

type ColumnListInfo = {
  pos: number;
  columnCount: number;
};

type ColumnDragHandlePluginState = {
  decorations: DecorationSet;
  columnLists: ColumnListInfo[];
  dragHandles: Map<number, DragHandleInstance>;
};

export const COLUMN_DRAG_HANDLE_PLUGIN_KEY = new PluginKey<ColumnDragHandlePluginState>("columnDragHandlePlugin");

/**
 * Find all column lists and their column counts in the document
 */
function findColumnLists(doc: ProseMirrorNode): ColumnListInfo[] {
  const columnLists: ColumnListInfo[] = [];

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node.type.name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) {
      // columnList can only have columns as children
      columnLists.push({ pos, columnCount: node.childCount });
      return false; // Don't descend into column list
    }
    return true;
  });

  return columnLists;
}

/**
 * Check if column structure has changed (not positions, but actual structure)
 */
function hasColumnStructureChanged(prev: ColumnListInfo[], current: ColumnListInfo[]): boolean {
  if (prev.length !== current.length) return true;

  for (let i = 0; i < prev.length; i++) {
    // Only check column count, not position (positions shift when typing)
    if (prev[i].columnCount !== current[i].columnCount) return true;
  }

  return false;
}

/**
 * Check if transaction has column-related changes worth processing
 */
function haveColumnRelatedChanges(
  editor: Editor,
  oldState: EditorState,
  newState: EditorState,
  tr: Transaction
): boolean {
  if (!editor.isEditable) return false;

  // Only process if document changed or selection changed
  return tr.docChanged || !newState.selection.eq(oldState.selection);
}

/**
 * Collect all column positions for creating decorations
 */
function collectColumnPositions(doc: ProseMirrorNode): number[] {
  const positions: number[] = [];
  const columnType = ADDITIONAL_EXTENSIONS.COLUMN as string;

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node.type.name === columnType) {
      positions.push(pos);
    }
  });

  return positions;
}

/**
 * Cleanup drag handles safely
 */
function cleanupDragHandles(dragHandles: Map<number, DragHandleInstance>): void {
  dragHandles.forEach((handle) => {
    try {
      handle.destroy();
    } catch (error) {
      console.error("[ColumnDragHandle] Error destroying handle:", error);
    }
  });
}

export const ColumnDragHandlePlugin = (editor: Editor, isFlagged: boolean): Plugin<ColumnDragHandlePluginState> =>
  new Plugin<ColumnDragHandlePluginState>({
    key: COLUMN_DRAG_HANDLE_PLUGIN_KEY,

    state: {
      init: () => ({
        decorations: DecorationSet.empty,
        columnLists: [],
        dragHandles: new Map<number, DragHandleInstance>(),
      }),

      apply(tr, prev, oldState, newState) {
        // Early exit if flagged
        if (isFlagged) {
          if (prev.dragHandles.size > 0) {
            cleanupDragHandles(prev.dragHandles);
          }
          return {
            decorations: DecorationSet.empty,
            columnLists: [],
            dragHandles: new Map<number, DragHandleInstance>(),
          };
        }

        const currentColumnLists = findColumnLists(newState.doc);

        // No columns exist - cleanup and return empty state
        if (currentColumnLists.length === 0) {
          if (prev.dragHandles.size > 0) {
            cleanupDragHandles(prev.dragHandles);
          }
          return {
            decorations: DecorationSet.empty,
            columnLists: [],
            dragHandles: new Map<number, DragHandleInstance>(),
          };
        }

        // Check if we have any changes worth processing
        if (!haveColumnRelatedChanges(editor, oldState, newState, tr)) {
          return prev;
        }

        // Check if structure changed (column count in any column list)
        const structureChanged = hasColumnStructureChanged(prev.columnLists, currentColumnLists);

        // If structure hasn't changed, just map the decorations
        if (!structureChanged && prev.decorations) {
          const mapped = prev.decorations.map(tr.mapping, tr.doc);

          // Verify decorations are still valid
          const positions = collectColumnPositions(newState.doc);
          let decorationsValid = positions.length === prev.dragHandles.size;

          if (decorationsValid) {
            for (const pos of positions) {
              if (mapped.find(pos + 1, pos + 2)?.length !== 1) {
                decorationsValid = false;
                break;
              }
            }
          }

          if (decorationsValid) {
            // Update each handle's position getter so closures stay current
            positions.forEach((pos, index) => {
              prev.dragHandles.get(index)?.updateGetColumnPos(() => pos);
            });
            return {
              decorations: mapped,
              columnLists: currentColumnLists,
              dragHandles: prev.dragHandles,
            };
          }
        }

        const recreatedPositions = collectColumnPositions(newState.doc);
        const decorations: Decoration[] = [];
        const dragHandles = new Map<number, DragHandleInstance>();

        recreatedPositions.forEach((pos, index) => {
          let dragHandle: DragHandleInstance | undefined = prev.dragHandles.get(index);
          if (dragHandle) {
            dragHandle.updateGetColumnPos(() => pos);
          } else {
            dragHandle = createColumnDragHandle(editor, () => pos, index);
          }

          dragHandles.set(index, dragHandle);
          const handleElement = dragHandle.element;
          decorations.push(
            Decoration.widget(pos + 1, () => handleElement, {
              key: `column-drag-handle-${index}`,
              side: -1,
            })
          );
        });

        prev.dragHandles.forEach((handle: DragHandleInstance, index: number) => {
          if (!dragHandles.has(index)) {
            try {
              handle.destroy();
            } catch (error) {
              console.error("[ColumnDragHandle] Error destroying handle:", error);
            }
          }
        });

        return {
          decorations: DecorationSet.create(newState.doc, decorations),
          columnLists: currentColumnLists,
          dragHandles,
        };
      },
    },

    props: {
      decorations(state) {
        return COLUMN_DRAG_HANDLE_PLUGIN_KEY.getState(state)?.decorations;
      },
    },

    destroy() {
      const state = editor.state && COLUMN_DRAG_HANDLE_PLUGIN_KEY.getState(editor.state);
      if (state?.dragHandles) {
        cleanupDragHandles(state.dragHandles);
      }
    },
  });

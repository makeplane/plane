import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TableMap } from "@tiptap/pm/tables";
import type { Editor } from "@tiptap/react";
import { MoveHorizontal } from "lucide-react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { BlockMenuOption } from "./block-menu";

const findSelectedTable = (editor: Editor): { tableNode: ProseMirrorNode | null; tablePos: number } => {
  const { state } = editor;
  const selectedNode = state.selection.content().content.firstChild;

  if (selectedNode?.type.name === CORE_EXTENSIONS.TABLE) {
    return {
      tableNode: selectedNode,
      tablePos: state.selection.from,
    };
  }

  return { tableNode: null, tablePos: -1 };
};

const setTableToFullWidth = (editor: Editor): void => {
  try {
    const { state, view } = editor;

    // Find the selected table
    const { tableNode, tablePos } = findSelectedTable(editor);
    if (!tableNode) return;

    // Get content width from CSS variable
    const editorContainer = view.dom.closest(".editor-container");
    if (!editorContainer) return;

    const contentWidthVar = getComputedStyle(editorContainer).getPropertyValue("--editor-content-width").trim();
    if (!contentWidthVar) return;

    const contentWidth = parseInt(contentWidthVar);
    if (isNaN(contentWidth) || contentWidth <= 0) return;

    // Calculate equal width for each column
    const map = TableMap.get(tableNode);
    const equalWidth = Math.floor(contentWidth / map.width);

    // Update all cell widths
    const tr = state.tr;
    const tableStart = tablePos + 1;
    const updatedCells = new Set<number>();

    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        const cellIndex = row * map.width + col;
        const cellPos = map.map[cellIndex];

        // Skip if cell already updated (for merged cells)
        if (updatedCells.has(cellPos)) continue;

        const cell = state.doc.nodeAt(tableStart + cellPos);
        if (!cell) continue;

        // Handle colspan for merged cells
        const colspan = cell.attrs.colspan || 1;
        tr.setNodeMarkup(tableStart + cellPos, null, {
          ...cell.attrs,
          colwidth: Array(colspan).fill(equalWidth),
        });

        updatedCells.add(cellPos);
      }
    }

    view.dispatch(tr);
  } catch (error) {
    console.error("Error setting table to full width:", error);
  }
};

export const getNodeOptions = (editor: Editor): BlockMenuOption[] => [
  {
    icon: MoveHorizontal,
    key: "table-full-width",
    label: "Fit to width",
    isDisabled: !editor.isActive(CORE_EXTENSIONS.TABLE),
    onClick: () => setTableToFullWidth(editor),
  },
];

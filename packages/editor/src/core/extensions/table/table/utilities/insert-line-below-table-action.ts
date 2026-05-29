import type { KeyboardShortcutCommand } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { findParentNodeOfType } from "@/helpers/common";

export const insertLineBelowTableAction: KeyboardShortcutCommand = ({ editor }) => {
  // Check if the current selection or the closest node is a table
  if (!editor.isActive(CORE_EXTENSIONS.TABLE)) return false;

  try {
    // Get the current selection
    const { selection } = editor.state;

    // Find the table node and its position
    const tableNode = findParentNodeOfType(selection, [CORE_EXTENSIONS.TABLE]);
    if (!tableNode) return false;

    const tablePos = tableNode.pos;
    const table = tableNode.node;

    // Determine if the selection is in the last row of the table
    const rowCount = table.childCount;
    const lastRow = table.child(rowCount - 1);
    const selectionPath = (selection.$anchor as any).path;
    const selectionInLastRow = selectionPath.includes(lastRow);

    if (!selectionInLastRow) return false;

    // Calculate the position immediately after the table
    const nextNodePos = tablePos + table.nodeSize;

    // Check for an existing node immediately after the table
    const nextNode = editor.state.doc.nodeAt(nextNodePos);

    if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
      // If the next node is an paragraph, move the cursor there
      const endOfParagraphPos = nextNodePos + nextNode.nodeSize - 1;
      editor.chain().setTextSelection(endOfParagraphPos).run();
    } else if (!nextNode) {
      // If the next node doesn't exist i.e. we're at the end of the document, create and insert a new empty node there
      editor.chain().insertContentAt(nextNodePos, { type: CORE_EXTENSIONS.PARAGRAPH }).run();
      editor
        .chain()
        .setTextSelection(nextNodePos + 1)
        .run();
    } else {
      return false;
    }

    return true;
  } catch (e) {
    console.error("failed to insert line above table", e);
    return false;
  }
};

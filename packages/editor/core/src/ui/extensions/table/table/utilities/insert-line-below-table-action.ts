import { KeyboardShortcutCommand } from "@tiptap/core";
import { Selection, TextSelection } from "prosemirror-state";

export const insertLineBelowTableAction: KeyboardShortcutCommand = ({ editor }) => {
  const { selection, tr, schema } = editor.state;

  // Check if the selection is inside a table and get the table node and its position
  const tableNode = findParentNodeOfType(selection, "table");
  if (!tableNode) return false;

  const tablePos = tableNode.pos;
  const table = tableNode.node;

  // Determine if the selection is in the last row of the table
  const rowCount = table.childCount;
  const lastRow = table.child(rowCount - 1);
  const selectionPath = (selection.$anchor as any).path;
  const selectionInLastRow = selectionPath.includes(lastRow);

  if (!selectionInLastRow) return false;

  // Check for an existing empty node immediately after the table
  const nextNodePos = tablePos + table.nodeSize;
  const nextNode = tr.doc.nodeAt(nextNodePos);

  // If the next node is an empty paragraph, move the cursor there
  if (nextNode && nextNode.type.name === "paragraph") {
    const newPos = nextNodePos + 1; // Position inside the existing paragraph
    const newSelection = TextSelection.create(tr.doc, newPos);
    tr.setSelection(newSelection);
  } else if (nextNode) {
    return false;
  } else {
    // If there's no node, or it's not an empty paragraph, insert a new paragraph and move the cursor there
    // tr.insert(nextNodePos, schema.nodes.paragraph.create());
    // const newPos = nextNodePos + 1; // Position after the inserted paragraph node
    // const newSelection = TextSelection.create(tr.doc, newPos);
    // tr.setSelection(newSelection);
    tr.insert(nextNodePos, schema.nodes.paragraph.create());
    editor.view.dispatch(tr); // Dispatch the transaction to insert the paragraph
    const newPos = tr.mapping.map(nextNodePos + 1); // Accurately map the new position
    // editor.chain().focus().setTextSelection(newPos).run();
    editor.commands.focus("end");
    // const newSelection = TextSelection.create(editor.state.doc, newPos); // Create a new selection at the mapped position
    // editor.state.tr.setSelection(newSelection).scrollIntoView(); // Set the new selection and ensure it's visible
    // editor.view.dispatch(editor.state.tr); // Dispatch the updated transaction
  }

  if (tr.docChanged) {
    return true;
  }

  return false;
};

// Helper function to find the parent node of a specific type
export function findParentNodeOfType(selection: Selection, typeName: string) {
  let depth = selection.$anchor.depth;
  while (depth > 0) {
    const node = selection.$anchor.node(depth);
    if (node.type.name === typeName) {
      return { node, pos: selection.$anchor.start(depth) - 1 };
    }
    depth--;
  }
  return null;
}

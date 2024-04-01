import { Editor } from "@tiptap/core";

export function isCursorInSubList(editor: Editor) {
  const { selection } = editor.state;
  const { $from } = selection;

  // Check if the current node is a list item
  const listItem = editor.schema.nodes.listItem;

  // Traverse up the document tree from the current position
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type === listItem) {
      // If the parent of the list item is also a list, it's a sub-list
      const parent = $from.node(depth - 1);
      if (
        parent &&
        (parent.type === editor.schema.nodes.bulletList || parent.type === editor.schema.nodes.orderedList)
      ) {
        return true;
      }
    }
  }

  return false;
}

import { EditorState } from "@tiptap/pm/state";

export const isCurrentParagraphASibling = (state: EditorState): boolean => {
  const { $from } = state.selection;
  const listItemNode = $from.node(-1); // Get the parent node of the current selection, assuming it's a list item.
  const currentParagraphNode = $from.parent; // Get the current node where the selection is.

  // Ensure we're in a paragraph and the parent is a list item.
  if (currentParagraphNode.type.name === "paragraph" && listItemNode.type.name === "listItem") {
    let paragraphNodesCount = 0;
    listItemNode.forEach((child) => {
      if (child.type.name === "paragraph") {
        paragraphNodesCount++;
      }
    });

    // If there are more than one paragraph nodes, the current paragraph is a sibling.
    return paragraphNodesCount > 1;
  }

  return false;
};

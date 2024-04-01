import { EditorState } from "@tiptap/pm/state";
import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";

export const getPrevListDepth = (typeOrName: string, state: EditorState) => {
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos) {
    return false;
  }

  let depth = 0;
  const pos = listItemPos.$pos;

  // Adjust the position to ensure we're within the list item, especially for edge cases
  const resolvedPos = state.doc.resolve(Math.max(pos.pos - 1, 0));

  // Traverse up the document structure from the adjusted position
  for (let d = resolvedPos.depth; d > 0; d--) {
    const node = resolvedPos.node(d);
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      // Increment depth for each list ancestor found
      depth++;
    }
  }

  // Subtract 1 from the calculated depth to get the parent list's depth
  // This adjustment is necessary because the depth calculation includes the current list
  // By subtracting 1, we aim to get the depth of the parent list, which helps in identifying if the current list is a sublist
  depth = depth > 0 ? depth - 1 : 0;

  // Double the depth value to get results as 2, 4, 6, 8, etc.
  depth = depth * 2;

  console.log("Parent list depth", depth);
  return depth;
};

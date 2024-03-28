import { EditorState } from "@tiptap/pm/state";
import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";

export const getPrevListDepth = (typeOrName: string, state: EditorState) => {
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos) {
    return false;
  }

  let depth = -2;
  let pos = listItemPos.$pos;

  // Adjust the position to ensure we're within the list item, especially for edge cases
  // This adjustment aims to more accurately reflect the document structure
  let adjustedPos = pos;
  // Adjusting the position by -3 to account for the off-by-three error
  adjustedPos = state.doc.resolve(Math.max(adjustedPos.pos - 3, 0));

  // Traverse up the document structure from the adjusted position
  for (let d = adjustedPos.depth; d > 0; d--) {
    const node = adjustedPos.node(d);
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      depth++;
    }
  }

  console.log("depth", depth);
  return depth;
};

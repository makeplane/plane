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
      depth++;
    }
  }

  console.log("depth", depth);
  return depth;
};

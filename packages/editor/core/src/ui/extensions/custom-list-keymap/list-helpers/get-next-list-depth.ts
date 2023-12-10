import { getNodeAtPosition } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

import { findListItemPos } from "./find-list-item-pos";

export const getNextListDepth = (typeOrName: string, state: EditorState) => {
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos) {
    return false;
  }

  const [, depth] = getNodeAtPosition(state, typeOrName, listItemPos.$pos.pos + 4);

  return depth;
};

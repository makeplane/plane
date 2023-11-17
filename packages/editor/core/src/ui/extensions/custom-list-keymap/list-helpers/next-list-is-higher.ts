import { EditorState } from "@tiptap/pm/state";

import { findListItemPos } from "./find-list-item-pos";
import { getNextListDepth } from "./get-next-list-depth";

export const nextListIsHigher = (typeOrName: string, state: EditorState) => {
  const listDepth = getNextListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth < listItemPos.depth) {
    return true;
  }

  return false;
};

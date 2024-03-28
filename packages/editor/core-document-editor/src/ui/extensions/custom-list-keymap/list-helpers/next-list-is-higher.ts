import { EditorState } from "@tiptap/pm/state";

import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";
import { getNextListDepth } from "src/ui/extensions/custom-list-keymap/list-helpers/get-next-list-depth";

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

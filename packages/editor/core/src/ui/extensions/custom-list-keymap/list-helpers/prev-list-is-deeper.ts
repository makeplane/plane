import { EditorState } from "@tiptap/pm/state";

import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";
import { getPrevListDepth } from "./get-prev-list-depth";

export const prevListIsHigher = (typeOrName: string, state: EditorState) => {
  const listDepth = getPrevListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  console.log(listDepth, listItemPos.depth, listItemPos, listDepth < listItemPos.depth);
  if (listDepth < listItemPos.depth) {
    return true;
  }

  return false;
};

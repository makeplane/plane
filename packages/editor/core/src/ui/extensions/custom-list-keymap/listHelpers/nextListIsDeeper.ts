import { EditorState } from "@tiptap/pm/state";

import { findListItemPos } from "./findListItemPos";
import { getNextListDepth } from "./getNextListDepth";

export const nextListIsDeeper = (typeOrName: string, state: EditorState) => {
  const listDepth = getNextListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth > listItemPos.depth) {
    return true;
  }

  return false;
};

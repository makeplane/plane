import { EditorState } from "@tiptap/pm/state";

export const hasListItemBefore = (typeOrName: string, state: EditorState): boolean => {
  const { $anchor } = state.selection;

  const $targetPos = state.doc.resolve($anchor.pos - 2);

  if ($targetPos.index() === 0) {
    return false;
  }

  if ($targetPos.nodeBefore?.type.name !== typeOrName) {
    return false;
  }

  return true;
};

import { EditorState } from "@tiptap/pm/state";

export const hasListBefore = (editorState: EditorState, name: string, parentListTypes: string[]) => {
  const { $anchor } = editorState.selection;

  const previousNodePos = Math.max(0, $anchor.pos - 2);

  const previousNode = editorState.doc.resolve(previousNodePos).node();

  if (!previousNode || !parentListTypes.includes(previousNode.type.name)) {
    return false;
  }

  return true;
};

import { getNodeType } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

export const findListItemPos = (typeOrName: string | NodeType, state: EditorState) => {
  const { $from } = state.selection;
  const nodeType = getNodeType(typeOrName, state.schema);

  let currentNode = null;
  let currentDepth = $from.depth;
  let currentPos = $from.pos;
  let targetDepth: number | null = null;

  while (currentDepth > 0 && targetDepth === null) {
    currentNode = $from.node(currentDepth);

    if (currentNode.type === nodeType) {
      targetDepth = currentDepth;
    } else {
      currentDepth -= 1;
      currentPos -= 1;
    }
  }

  if (targetDepth === null) {
    return null;
  }

  return { $pos: state.doc.resolve(currentPos), depth: targetDepth };
};

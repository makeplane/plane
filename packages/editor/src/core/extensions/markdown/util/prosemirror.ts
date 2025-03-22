import { Node as NodeType } from "@tiptap/pm/model";

export function childNodes(node: NodeType) {
  return node?.content?.content ?? [];
}

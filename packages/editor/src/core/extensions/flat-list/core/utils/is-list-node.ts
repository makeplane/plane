import { type Node as ProsemirrorNode } from "@tiptap/pm/model";

import { isListType } from "./is-list-type";

/** @public */
export function isListNode(node: ProsemirrorNode | null | undefined): boolean {
  if (!node) return false;
  return isListType(node.type);
}

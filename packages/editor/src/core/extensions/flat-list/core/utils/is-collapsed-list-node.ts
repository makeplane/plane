import { type ListAttributes, type ProsemirrorNode } from "../types";

import { isListNode } from "./is-list-node";

/**
 * @internal
 */
export function isCollapsedListNode(node: ProsemirrorNode): boolean {
  return !!(isListNode(node) && (node.attrs as ListAttributes).collapsed);
}

import { ProsemirrorNode, ListAttributes } from "prosemirror-flat-list";
import { isListNode } from "./is-list-node";

/**
 * @internal
 */
export function isCollapsedListNode(node: ProsemirrorNode): boolean {
  return !!(isListNode(node) && (node.attrs as ListAttributes).collapsed);
}

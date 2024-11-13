import { type ResolvedPos } from "prosemirror-model";

import { isListNode } from "./is-list-node";
import { ListAttributes } from "prosemirror-flat-list";

export function inCollapsedList($pos: ResolvedPos): boolean {
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isListNode(node)) {
      const attrs = node.attrs as ListAttributes;
      if (attrs.collapsed) {
        return true;
      }
    }
  }
  return false;
}

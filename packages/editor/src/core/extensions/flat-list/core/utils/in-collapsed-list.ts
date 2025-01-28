import { type ResolvedPos } from "@tiptap/pm/model";

import { type ListAttributes } from "../types";

import { isListNode } from "./is-list-node";

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

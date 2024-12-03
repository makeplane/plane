import { type Transaction } from "@tiptap/pm/state";

import { type ListAttributes } from "../types";

import { isListNode } from "./is-list-node";
import { setNodeAttributes } from "./set-node-attributes";

export function setListAttributes<T extends ListAttributes = ListAttributes>(
  tr: Transaction,
  pos: number,
  attrs: T
): boolean {
  const $pos = tr.doc.resolve(pos);
  const node = $pos.nodeAfter;

  if (node && isListNode(node)) {
    const oldAttrs: T = node.attrs as T;
    const newAttrs: T = { ...oldAttrs, ...attrs };
    return setNodeAttributes(tr, pos, oldAttrs, newAttrs);
  }
  return false;
}

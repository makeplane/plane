import { NodeRange } from "prosemirror-model";
import { type Command } from "prosemirror-state";
import { findWrapping } from "prosemirror-transform";

import { getListType } from "../utils/get-list-type";
import { isListNode } from "../utils/is-list-node";
import { setNodeAttributes } from "../utils/set-node-attributes";
import { ListAttributes } from "prosemirror-flat-list";

/**
 * The list node attributes or a callback function to take the current
 * selection block range and return list node attributes. If this callback
 * function returns null, the command won't do anything.
 *
 * @public
 */
export type WrapInListGetAttrs<T extends ListAttributes> = T | ((range: NodeRange) => T | null);

/**
 * Returns a command function that wraps the selection in a list with the given
 * type and attributes.
 *
 * @public @group Commands
 */
export function createWrapInListCommand<T extends ListAttributes = ListAttributes>(
  getAttrs: WrapInListGetAttrs<T>
): Command {
  const wrapInList: Command = (state, dispatch): boolean => {
    const { $from, $to } = state.selection;

    let range = $from.blockRange($to);
    if (!range) {
      return false;
    }

    if (rangeAllowInlineContent(range) && isListNode(range.parent) && range.depth > 0 && range.startIndex === 0) {
      range = new NodeRange($from, $to, range.depth - 1);
    }

    const attrs: T | null = typeof getAttrs === "function" ? getAttrs(range) : getAttrs;
    if (!attrs) {
      return false;
    }

    const { parent, startIndex, endIndex, depth } = range;
    const tr = state.tr;
    const listType = getListType(state.schema);

    for (let i = endIndex - 1; i >= startIndex; i--) {
      const node = parent.child(i);
      if (isListNode(node)) {
        const oldAttrs: T = node.attrs as T;
        const newAttrs: T = { ...oldAttrs, ...attrs };
        setNodeAttributes(tr, $from.posAtIndex(i, depth), oldAttrs, newAttrs);
      } else {
        const beforeNode = $from.posAtIndex(i, depth);
        const afterNode = $from.posAtIndex(i + 1, depth);

        let nodeStart = beforeNode + 1;
        let nodeEnd = afterNode - 1;
        if (nodeStart > nodeEnd) {
          [nodeStart, nodeEnd] = [nodeEnd, nodeStart];
        }

        const range = new NodeRange(tr.doc.resolve(nodeStart), tr.doc.resolve(nodeEnd), depth);

        const wrapping = findWrapping(range, listType, attrs);
        if (wrapping) {
          tr.wrap(range, wrapping);
        }
      }
    }

    dispatch?.(tr);
    return true;
  };

  return wrapInList;
}

function rangeAllowInlineContent(range: NodeRange): boolean {
  const { parent, startIndex, endIndex } = range;
  for (let i = startIndex; i < endIndex; i++) {
    if (parent.child(i).inlineContent) {
      return true;
    }
  }
  return false;
}

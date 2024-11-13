import { type NodeRange } from "prosemirror-model";
import { type Command } from "prosemirror-state";

import { isListNode } from "../utils/is-list-node";
import { isNodeSelection } from "../utils/is-node-selection";
import { safeLiftFromTo } from "../utils/safe-lift";

import { dedentOutOfList } from "./dedent-list";
import { ProsemirrorNode, ListAttributes } from "prosemirror-flat-list";

/**
 * @public
 */
export interface UnwrapListOptions {
  /**
   * If given, only this kind of list will be unwrap.
   */
  kind?: string;
}

/**
 * Returns a command function that unwraps the list around the selection.
 *
 * @public
 */
export function createUnwrapListCommand(options?: UnwrapListOptions): Command {
  const kind = options?.kind;

  const unwrapList: Command = (state, dispatch) => {
    const selection = state.selection;

    if (isNodeSelection(selection) && isTargetList(selection.node, kind)) {
      if (dispatch) {
        const tr = state.tr;
        safeLiftFromTo(tr, tr.selection.from + 1, tr.selection.to - 1);
        dispatch(tr.scrollIntoView());
      }
      return true;
    }

    const range = selection.$from.blockRange(selection.$to);

    if (range && isTargetListsRange(range, kind)) {
      const tr = state.tr;
      if (dedentOutOfList(tr, range)) {
        dispatch?.(tr);
        return true;
      }
    }

    if (range && isTargetList(range.parent, kind)) {
      if (dispatch) {
        const tr = state.tr;
        safeLiftFromTo(tr, range.$from.start(range.depth), range.$to.end(range.depth));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }

    return false;
  };

  return unwrapList;
}

function isTargetList(node: ProsemirrorNode, kind: string | undefined) {
  if (isListNode(node)) {
    if (kind) {
      return (node.attrs as ListAttributes).kind === kind;
    }
    return true;
  }
  return false;
}

function isTargetListsRange(range: NodeRange, kind: string | undefined): boolean {
  const { startIndex, endIndex, parent } = range;

  for (let i = startIndex; i < endIndex; i++) {
    if (!isTargetList(parent.child(i), kind)) {
      return false;
    }
  }

  return true;
}

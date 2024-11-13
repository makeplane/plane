import { Fragment, NodeRange, Slice } from "prosemirror-model";
import { type Command, type Transaction } from "prosemirror-state";
import { ReplaceAroundStep } from "prosemirror-transform";

import { withVisibleSelection } from "./set-safe-selection";
import { findListsRange, isListNode, isListsRange, getListType } from "prosemirror-flat-list";
import { atStartBlockBoundary, atEndBlockBoundary } from "../utils/block-boundary";
import { mapPos } from "../utils/map-pos";
import { safeLift } from "../utils/safe-lift";
import { zoomInRange } from "../utils/zoom-in-range";

/**
 * @public
 */
export interface DedentListOptions {
  /**
   * A optional from position to indent.
   *
   * @defaultValue `state.selection.from`
   */
  from?: number;

  /**
   * A optional to position to indent.
   *
   * @defaultValue `state.selection.to`
   */
  to?: number;
}

/**
 * Returns a command function that decreases the indentation of selected list nodes.
 *
 * @public @group Commands
 */
export function createDedentListCommand(options?: DedentListOptions): Command {
  const dedentListCommand: Command = (state, dispatch): boolean => {
    const tr = state.tr;

    const $from = options?.from == null ? tr.selection.$from : tr.doc.resolve(options.from);
    const $to = options?.to == null ? tr.selection.$to : tr.doc.resolve(options.to);

    const range = findListsRange($from, $to);
    if (!range) return false;

    if (dedentRange(range, tr)) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };

  return withVisibleSelection(dedentListCommand);
}

function dedentRange(range: NodeRange, tr: Transaction, startBoundary?: boolean, endBoundary?: boolean): boolean {
  const { depth, $from, $to } = range;

  startBoundary = startBoundary || atStartBlockBoundary($from, depth + 1);

  if (!startBoundary) {
    const { startIndex, endIndex } = range;
    if (endIndex - startIndex === 1) {
      const contentRange = zoomInRange(range);
      return contentRange ? dedentRange(contentRange, tr) : false;
    } else {
      return splitAndDedentRange(range, tr, startIndex + 1);
    }
  }

  endBoundary = endBoundary || atEndBlockBoundary($to, depth + 1);

  if (!endBoundary) {
    fixEndBoundary(range, tr);
    const endOfParent = $to.end(depth);
    range = new NodeRange(tr.doc.resolve($from.pos), tr.doc.resolve(endOfParent), depth);
    return dedentRange(range, tr, undefined, true);
  }

  if (range.startIndex === 0 && range.endIndex === range.parent.childCount && isListNode(range.parent)) {
    return dedentNodeRange(new NodeRange($from, $to, depth - 1), tr);
  }

  return dedentNodeRange(range, tr);
}

/**
 * Split a range into two parts, and dedent them separately.
 */
function splitAndDedentRange(range: NodeRange, tr: Transaction, splitIndex: number): boolean {
  const { $from, $to, depth } = range;

  const splitPos = $from.posAtIndex(splitIndex, depth);

  const range1 = $from.blockRange(tr.doc.resolve(splitPos - 1));
  if (!range1) return false;

  const getRange2From = mapPos(tr, splitPos + 1);
  const getRange2To = mapPos(tr, $to.pos);

  dedentRange(range1, tr, undefined, true);

  let range2 = tr.doc.resolve(getRange2From()).blockRange(tr.doc.resolve(getRange2To()));

  if (range2 && range2.depth >= depth) {
    range2 = new NodeRange(range2.$from, range2.$to, depth);
    dedentRange(range2, tr, true, undefined);
  }
  return true;
}

export function dedentNodeRange(range: NodeRange, tr: Transaction) {
  if (isListNode(range.parent)) {
    return safeLiftRange(tr, range);
  } else if (isListsRange(range)) {
    return dedentOutOfList(tr, range);
  } else {
    return safeLiftRange(tr, range);
  }
}

function safeLiftRange(tr: Transaction, range: NodeRange): boolean {
  if (moveRangeSiblings(tr, range)) {
    const $from = tr.doc.resolve(range.$from.pos);
    const $to = tr.doc.resolve(range.$to.pos);
    range = new NodeRange($from, $to, range.depth);
  }
  return safeLift(tr, range);
}

function moveRangeSiblings(tr: Transaction, range: NodeRange): boolean {
  const listType = getListType(tr.doc.type.schema);
  const { $to, depth, end, parent, endIndex } = range;
  const endOfParent = $to.end(depth);

  if (end < endOfParent) {
    // There are siblings after the lifted items, which must become
    // children of the last item
    const lastChild = parent.maybeChild(endIndex - 1);
    if (!lastChild) return false;

    const canAppend =
      endIndex < parent.childCount &&
      lastChild.canReplace(lastChild.childCount, lastChild.childCount, parent.content, endIndex, parent.childCount);

    if (canAppend) {
      tr.step(
        new ReplaceAroundStep(
          end - 1,
          endOfParent,
          end,
          endOfParent,
          new Slice(Fragment.from(listType.create(null)), 1, 0),
          0,
          true
        )
      );
      return true;
    } else {
      tr.step(
        new ReplaceAroundStep(
          end,
          endOfParent,
          end,
          endOfParent,
          new Slice(Fragment.from(listType.create(null)), 0, 0),
          1,
          true
        )
      );
      return true;
    }
  }
  return false;
}

function fixEndBoundary(range: NodeRange, tr: Transaction): void {
  if (range.endIndex - range.startIndex >= 2) {
    range = new NodeRange(
      range.$to.doc.resolve(range.$to.posAtIndex(range.endIndex - 1, range.depth)),
      range.$to,
      range.depth
    );
  }

  const contentRange = zoomInRange(range);
  if (contentRange) {
    fixEndBoundary(contentRange, tr);
    range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(range.$to.pos), range.depth);
  }

  moveRangeSiblings(tr, range);
}

export function dedentOutOfList(tr: Transaction, range: NodeRange): boolean {
  const { startIndex, endIndex, parent } = range;

  const getRangeStart = mapPos(tr, range.start);
  const getRangeEnd = mapPos(tr, range.end);

  // Merge the list nodes into a single big list node
  for (let end = getRangeEnd(), i = endIndex - 1; i > startIndex; i--) {
    end -= parent.child(i).nodeSize;
    tr.delete(end - 1, end + 1);
  }

  const $start = tr.doc.resolve(getRangeStart());
  const listNode = $start.nodeAfter;

  if (!listNode) return false;

  const start = range.start;
  const end = start + listNode.nodeSize;

  if (getRangeEnd() !== end) return false;

  if (!$start.parent.canReplace(startIndex, startIndex + 1, Fragment.from(listNode))) {
    return false;
  }

  tr.step(new ReplaceAroundStep(start, end, start + 1, end - 1, new Slice(Fragment.empty, 0, 0), 0, true));
  return true;
}

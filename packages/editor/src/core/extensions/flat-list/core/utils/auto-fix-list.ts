import { type Transaction } from "@tiptap/pm/state";
import { canJoin, canSplit } from "@tiptap/pm/transform";

import { type ProsemirrorNode } from "../types";

import { isListNode } from "./is-list-node";
import { patchCommand } from "./patch-command";

/** @internal */
export function* getTransactionRanges(tr: Transaction): Generator<number[], never> {
  const ranges: number[] = [];
  let i = 0;

  while (true) {
    for (; i < tr.mapping.maps.length; i++) {
      const map = tr.mapping.maps[i];
      for (let j = 0; j < ranges.length; j++) {
        ranges[j] = map.map(ranges[j]);
      }

      map.forEach((_oldStart, _oldEnd, newStart, newEnd) => ranges.push(newStart, newEnd));
    }

    yield ranges;
  }
}

/** @internal */
export function findBoundaries(
  positions: number[],
  doc: ProsemirrorNode,
  prediction: (before: ProsemirrorNode, after: ProsemirrorNode, parent: ProsemirrorNode, index: number) => boolean
): number[] {
  const boundaries = new Set<number>();
  const joinable: number[] = [];

  for (const pos of positions) {
    const $pos = doc.resolve(pos);
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const boundary = $pos.before(depth + 1);
      if (boundaries.has(boundary)) {
        break;
      }
      boundaries.add(boundary);

      const index = $pos.index(depth);
      const parent = $pos.node(depth);

      const before = parent.maybeChild(index - 1);
      if (!before) continue;

      const after = parent.maybeChild(index);
      if (!after) continue;

      if (prediction(before, after, parent, index)) {
        joinable.push(boundary);
      }
    }
  }

  // Sort in the descending order
  return joinable.sort((a, b) => b - a);
}

function isListJoinable(before: ProsemirrorNode, after: ProsemirrorNode): boolean {
  return isListNode(before) && isListNode(after) && isListNode(after.firstChild);
}

function isListSplitable(
  before: ProsemirrorNode,
  after: ProsemirrorNode,
  parent: ProsemirrorNode,
  index: number
): boolean {
  if (index === 1 && isListNode(parent) && isListNode(before) && !isListNode(after)) {
    return true;
  }
  return false;
}

function fixList(tr: Transaction): Transaction {
  const ranges = getTransactionRanges(tr);

  const joinable = findBoundaries(ranges.next().value, tr.doc, isListJoinable);

  for (const pos of joinable) {
    if (canJoin(tr.doc, pos)) {
      tr.join(pos);
    }
  }

  const splitable = findBoundaries(ranges.next().value, tr.doc, isListSplitable);

  for (const pos of splitable) {
    if (canSplit(tr.doc, pos)) {
      tr.split(pos);
    }
  }

  return tr;
}

/** @internal */
export const withAutoFixList = patchCommand(fixList);

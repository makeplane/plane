import { type ResolvedPos } from "prosemirror-model";
import { type Command, TextSelection } from "prosemirror-state";

import { atTextblockStart } from "../utils/at-textblock-start";
import { isListNode } from "../utils/is-list-node";

import { joinTextblocksAround } from "./join-textblocks-around";
import { ListAttributes } from "prosemirror-flat-list";

/**
 * If the selection is empty and at the start of a block, and there is a
 * collapsed list node right before the cursor, move current block and append it
 * to the first child of the collapsed list node (i.e. skip the hidden content).
 *
 * @public @group Commands
 */
export const joinCollapsedListBackward: Command = (state, dispatch, view) => {
  const $cursor = atTextblockStart(state, view);
  if (!$cursor) return false;

  const $cut = findCutBefore($cursor);
  if (!$cut) return false;

  const { nodeBefore, nodeAfter } = $cut;

  if (
    nodeBefore &&
    nodeAfter &&
    isListNode(nodeBefore) &&
    (nodeBefore.attrs as ListAttributes).collapsed &&
    nodeAfter.isBlock
  ) {
    const tr = state.tr;
    const listPos = $cut.pos - nodeBefore.nodeSize;
    tr.delete($cut.pos, $cut.pos + nodeAfter.nodeSize);
    const insert = listPos + 1 + nodeBefore.child(0).nodeSize;
    tr.insert(insert, nodeAfter);
    const $insert = tr.doc.resolve(insert);
    tr.setSelection(TextSelection.near($insert));
    if (joinTextblocksAround(tr, $insert, dispatch)) {
      return true;
    }
  }

  return false;
};

// https://github.com/prosemirror/prosemirror-commands/blob/e607d5abda0fcc399462e6452a82450f4118702d/src/commands.ts#L150
function findCutBefore($pos: ResolvedPos): ResolvedPos | null {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1));
      if ($pos.node(i).type.spec.isolating) break;
    }
  return null;
}

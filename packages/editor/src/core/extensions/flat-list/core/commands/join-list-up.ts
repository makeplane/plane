import { NodeRange, type ResolvedPos } from "@tiptap/pm/model"
import {
  type Command,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state"

import { atTextblockStart } from '../utils/at-textblock-start'
import { isListNode } from '../utils/is-list-node'
import { safeLift } from '../utils/safe-lift'

/**
 * If the text cursor is at the start of the first child of a list node, lift
 * all content inside the list. If the text cursor is at the start of the last
 * child of a list node, lift this child.
 *
 * @public @group Commands
 */
export const joinListUp: Command = (state, dispatch, view) => {
  const $cursor = atTextblockStart(state, view)
  if (!$cursor) return false

  const { depth } = $cursor
  if (depth < 2) return false
  const listDepth = depth - 1

  const listNode = $cursor.node(listDepth)
  if (!isListNode(listNode)) return false

  const indexInList = $cursor.index(listDepth)

  if (indexInList === 0) {
    if (dispatch) {
      liftListContent(state, dispatch, $cursor)
    }
    return true
  }

  if (indexInList === listNode.childCount - 1) {
    if (dispatch) {
      liftParent(state, dispatch, $cursor)
    }
    return true
  }

  return false
}

function liftListContent(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  $cursor: ResolvedPos,
) {
  const tr = state.tr
  const listDepth = $cursor.depth - 1
  const range = new NodeRange(
    $cursor,
    tr.doc.resolve($cursor.end(listDepth)),
    listDepth,
  )
  if (safeLift(tr, range)) {
    dispatch(tr)
  }
}

function liftParent(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  $cursor: ResolvedPos,
) {
  const tr = state.tr
  const range = $cursor.blockRange()
  if (range && safeLift(tr, range)) {
    dispatch(tr)
  }
}

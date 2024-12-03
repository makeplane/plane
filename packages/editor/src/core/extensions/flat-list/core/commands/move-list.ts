import { type Command, type Transaction } from "@tiptap/pm/state"

import { withAutoFixList } from '../utils/auto-fix-list'
import { cutByIndex } from '../utils/cut-by-index'
import { isListNode } from '../utils/is-list-node'
import { findListsRange } from '../utils/list-range'
import { safeLift } from '../utils/safe-lift'

/**
 * Returns a command function that moves up or down selected list nodes.
 *
 * @public @group Commands
 *
 */
export function createMoveListCommand(direction: 'up' | 'down'): Command {
  const moveList: Command = (state, dispatch): boolean => {
    const tr = state.tr
    if (doMoveList(tr, direction, true, !!dispatch)) {
      dispatch?.(tr)
      return true
    }
    return false
  }

  return withAutoFixList(moveList)
}

/** @internal */
export function doMoveList(
  tr: Transaction,
  direction: 'up' | 'down',
  canDedent: boolean,
  dispatch: boolean,
): boolean {
  const { $from, $to } = tr.selection
  const range = findListsRange($from, $to)
  if (!range) return false

  const { parent, depth, startIndex, endIndex } = range

  if (direction === 'up') {
    if (startIndex >= 2 || (startIndex === 1 && isListNode(parent.child(0)))) {
      const before = cutByIndex(parent.content, startIndex - 1, startIndex)
      const selected = cutByIndex(parent.content, startIndex, endIndex)
      if (
        parent.canReplace(startIndex - 1, endIndex, selected.append(before))
      ) {
        if (dispatch) {
          tr.insert($from.posAtIndex(endIndex, depth), before)
          tr.delete(
            $from.posAtIndex(startIndex - 1, depth),
            $from.posAtIndex(startIndex, depth),
          )
        }
        return true
      } else {
        return false
      }
    } else if (canDedent && isListNode(parent)) {
      return safeLift(tr, range) && doMoveList(tr, direction, false, dispatch)
    } else {
      return false
    }
  } else {
    if (endIndex < parent.childCount) {
      const selected = cutByIndex(parent.content, startIndex, endIndex)
      const after = cutByIndex(parent.content, endIndex, endIndex + 1)
      if (parent.canReplace(startIndex, endIndex + 1, after.append(selected))) {
        if (dispatch) {
          tr.delete(
            $from.posAtIndex(endIndex, depth),
            $from.posAtIndex(endIndex + 1, depth),
          )
          tr.insert($from.posAtIndex(startIndex, depth), after)
        }
        return true
      } else {
        return false
      }
    } else if (canDedent && isListNode(parent)) {
      return safeLift(tr, range) && doMoveList(tr, direction, false, dispatch)
    } else {
      return false
    }
  }
}

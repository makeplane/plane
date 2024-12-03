import type { Command } from "@tiptap/pm/state"

import { isCollapsedListNode } from '../utils/is-collapsed-list-node'

/**
 * This command will protect the collapsed items from being deleted.
 *
 * If current selection contains a collapsed item, we don't want the user to
 * delete this selection by pressing Backspace or Delete, because this could
 * be unintentional.
 *
 * In such case, we will stop the delete action and expand the collapsed items
 * instead. Therefore the user can clearly know what content he is trying to
 * delete.
 *
 * @public @group Commands
 *
 */
export const protectCollapsed: Command = (state, dispatch): boolean => {
  const tr = state.tr
  let found = false
  const { from, to } = state.selection

  state.doc.nodesBetween(from, to, (node, pos, parent, index) => {
    if (found && !dispatch) {
      return false
    }
    if (parent && isCollapsedListNode(parent) && index >= 1) {
      found = true
      if (!dispatch) {
        return false
      }

      const $pos = state.doc.resolve(pos)
      tr.setNodeAttribute($pos.before($pos.depth), 'collapsed', false)
    }
  })

  if (found) {
    dispatch?.(tr)
  }
  return found
}

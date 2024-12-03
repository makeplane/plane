import { type Command } from "@tiptap/pm/state"

import { type ListAttributes, type ProsemirrorNode } from '../types'
import { isListNode } from '../utils/is-list-node'

import { setSafeSelection } from './set-safe-selection'

/**
 * @public
 */
export interface ToggleCollapsedOptions {
  /**
   * If this value exists, the command will set the `collapsed` attribute to
   * this value instead of toggle it.
   */
  collapsed?: boolean

  /**
   * An optional function to accept a list node and return whether or not this
   * node can toggle its `collapsed` attribute.
   */
  isToggleable?: (node: ProsemirrorNode) => boolean
}

/**
 * Return a command function that toggle the `collapsed` attribute of the list node.
 *
 * @public @group Commands
 */
export function createToggleCollapsedCommand({
  collapsed = undefined,
  isToggleable = defaultIsToggleable,
}: ToggleCollapsedOptions = {}): Command {
  const toggleCollapsed: Command = (state, dispatch) => {
    const { $from } = state.selection

    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth)
      if (isListNode(node) && isToggleable(node)) {
        if (dispatch) {
          const pos = $from.before(depth)
          const attrs = node.attrs as ListAttributes
          const tr = state.tr
          tr.setNodeAttribute(pos, 'collapsed', collapsed ?? !attrs.collapsed)
          dispatch(setSafeSelection(tr))
        }
        return true
      }
    }
    return false
  }

  return toggleCollapsed
}

function defaultIsToggleable(node: ProsemirrorNode): boolean {
  const attrs = node.attrs as ListAttributes

  return (
    attrs.kind === 'toggle' &&
    node.childCount >= 2 &&
    !isListNode(node.firstChild)
  )
}

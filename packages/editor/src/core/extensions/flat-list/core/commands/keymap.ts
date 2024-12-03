import {
  chainCommands,
  deleteSelection,
  joinTextblockBackward,
  joinTextblockForward,
  selectNodeBackward,
  selectNodeForward,
} from 'prosemirror-commands'

import { createDedentListCommand } from './dedent-list'
import { createIndentListCommand } from './indent-list'
import { joinCollapsedListBackward } from './join-collapsed-backward'
import { joinListUp } from './join-list-up'
import { protectCollapsed } from './protect-collapsed'
import { createSplitListCommand } from './split-list'

/**
 * Keybinding for `Enter`. It's chained with following commands:
 *
 * - {@link protectCollapsed}
 * - {@link createSplitListCommand}
 *
 * @public @group Commands
 */
export const enterCommand = chainCommands(
  protectCollapsed,
  createSplitListCommand(),
)

/**
 * Keybinding for `Backspace`. It's chained with following commands:
 *
 * - {@link protectCollapsed}
 * - [deleteSelection](https://prosemirror.net/docs/ref/#commands.deleteSelection)
 * - {@link joinListUp}
 * - {@link joinCollapsedListBackward}
 * - [joinTextblockBackward](https://prosemirror.net/docs/ref/#commands.joinTextblockBackward)
 * - [selectNodeBackward](https://prosemirror.net/docs/ref/#commands.selectNodeBackward)
 *
 * @public @group Commands
 *
 */
export const backspaceCommand = chainCommands(
  protectCollapsed,
  deleteSelection,
  joinListUp,
  joinCollapsedListBackward,
  joinTextblockBackward,
  selectNodeBackward,
)

/**
 * Keybinding for `Delete`. It's chained with following commands:
 *
 * - {@link protectCollapsed}
 * - [deleteSelection](https://prosemirror.net/docs/ref/#commands.deleteSelection)
 * - [joinTextblockForward](https://prosemirror.net/docs/ref/#commands.joinTextblockForward)
 * - [selectNodeForward](https://prosemirror.net/docs/ref/#commands.selectNodeForward)
 *
 * @public @group Commands
 *
 */
export const deleteCommand = chainCommands(
  protectCollapsed,
  deleteSelection,
  joinTextblockForward,
  selectNodeForward,
)

/**
 * Returns an object containing the keymap for the list commands.
 *
 * - `Enter`: See {@link enterCommand}.
 * - `Backspace`: See {@link backspaceCommand}.
 * - `Delete`: See {@link deleteCommand}.
 * - `Mod-[`: Decrease indentation. See {@link createDedentListCommand}.
 * - `Mod-]`: Increase indentation. See {@link createIndentListCommand}.
 *
 * @public @group Commands
 */
export const listKeymap = {
  Enter: enterCommand,

  Backspace: backspaceCommand,

  Delete: deleteCommand,

  'Mod-[': createDedentListCommand(),

  'Mod-]': createIndentListCommand(),
}

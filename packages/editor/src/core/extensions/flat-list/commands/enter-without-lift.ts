import {
  chainCommands,
  createParagraphNear,
  newlineInCode,
  splitBlock,
} from 'prosemirror-commands'
import { type Command } from 'prosemirror-state'

/**
 * This command has the same behavior as the `Enter` keybinding from
 * `prosemirror-commands`, but without the `liftEmptyBlock` command.
 *
 * @internal
 */
export const enterWithoutLift: Command = chainCommands(
  newlineInCode,
  createParagraphNear,
  splitBlock,
)

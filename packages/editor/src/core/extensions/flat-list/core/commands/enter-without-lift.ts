import { chainCommands, createParagraphNear, newlineInCode, splitBlock } from "@tiptap/pm/commands";
import { type Command } from "@tiptap/pm/state";

/**
 * This command has the same behavior as the `Enter` keybinding from
 * `prosemirror-commands`, but without the `liftEmptyBlock` command.
 *
 * @internal
 */
export const enterWithoutLift: Command = chainCommands(newlineInCode, createParagraphNear, splitBlock);

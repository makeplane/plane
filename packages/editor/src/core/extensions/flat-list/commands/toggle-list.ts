import { chainCommands } from "prosemirror-commands";
import { type Command } from "prosemirror-state";

import { createUnwrapListCommand } from "./unwrap-list";
import { createWrapInListCommand } from "./wrap-in-list";
import { ListAttributes } from "prosemirror-flat-list";

/**
 * Returns a command function that wraps the selection in a list with the given
 * type and attributes, or change the list kind if the selection is already in
 * another kind of list, or unwrap the selected list if otherwise.
 *
 * @public
 */
export function createToggleListCommand<T extends ListAttributes = ListAttributes>(
  /**
   * The list node attributes to toggle.
   *
   * @public
   */
  attrs: T
): Command {
  const unwrapList = createUnwrapListCommand({ kind: attrs.kind });
  const wrapInList = createWrapInListCommand(attrs);
  return chainCommands(unwrapList, wrapInList);
}

import { imeSpan } from "prosemirror-safari-ime-span";
import { type Plugin } from "@tiptap/pm/state";

/**
 * Return a plugin as a workaround for a bug in Safari that causes the composition
 * based IME to remove the empty HTML element with CSS `position: relative`.
 *
 * See also https://github.com/ProseMirror/prosemirror/issues/934
 *
 * @public @group Plugins
 */
export function createSafariInputMethodWorkaroundPlugin(): Plugin {
  return imeSpan;
}

import { type ResolvedPos } from "@tiptap/pm/model";
import { type EditorState, type TextSelection } from "@tiptap/pm/state";
import { type EditorView } from "@tiptap/pm/view";

// Copied from https://github.com/prosemirror/prosemirror-commands/blob/1.5.0/src/commands.ts#L15
export function atTextblockStart(state: EditorState, view?: EditorView): ResolvedPos | null {
  const { $cursor } = state.selection as TextSelection;
  if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0)) return null;
  return $cursor;
}

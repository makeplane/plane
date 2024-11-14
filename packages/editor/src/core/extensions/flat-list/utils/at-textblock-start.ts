import { type ResolvedPos } from 'prosemirror-model'
import { type EditorState, type TextSelection } from 'prosemirror-state'
import { type EditorView } from 'prosemirror-view'

// Copied from https://github.com/prosemirror/prosemirror-commands/blob/1.5.0/src/commands.ts#L15
export function atTextblockStart(
  state: EditorState,
  view?: EditorView,
): ResolvedPos | null {
  const { $cursor } = state.selection as TextSelection
  if (
    !$cursor ||
    (view ? !view.endOfTextblock('backward', state) : $cursor.parentOffset > 0)
  )
    return null
  return $cursor
}

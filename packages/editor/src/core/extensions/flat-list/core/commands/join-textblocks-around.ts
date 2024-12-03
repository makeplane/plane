/* eslint-disable prefer-const */

import { type ResolvedPos, Slice } from "@tiptap/pm/model"
import { TextSelection, type Transaction } from "@tiptap/pm/state"
import { replaceStep, ReplaceStep } from "@tiptap/pm/transform"

// prettier-ignore
// https://github.com/prosemirror/prosemirror-commands/blob/e607d5abda0fcc399462e6452a82450f4118702d/src/commands.ts#L94
function joinTextblocksAround(tr: Transaction, $cut: ResolvedPos, dispatch?: (tr: Transaction) => void) {
  let before = $cut.nodeBefore!, beforeText = before, beforePos = $cut.pos - 1
  for (; !beforeText.isTextblock; beforePos--) {
    if (beforeText.type.spec.isolating) return false
    let child = beforeText.lastChild
    if (!child) return false
    beforeText = child
  }
  let after = $cut.nodeAfter!, afterText = after, afterPos = $cut.pos + 1
  for (; !afterText.isTextblock; afterPos++) {
    if (afterText.type.spec.isolating) return false
    let child = afterText.firstChild
    if (!child) return false
    afterText = child
  }
  let step = replaceStep(tr.doc, beforePos, afterPos, Slice.empty) as ReplaceStep | null
  if (!step || step.from != beforePos ||
      step instanceof ReplaceStep && step.slice.size >= afterPos - beforePos) return false
  if (dispatch) {
    tr.step(step)
    tr.setSelection(TextSelection.create(tr.doc, beforePos))
    dispatch(tr.scrollIntoView())
  }
  return true

}

export { joinTextblocksAround }

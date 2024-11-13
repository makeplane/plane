import { type NodeRange } from 'prosemirror-model'

/**
 * Returns a deeper block range if possible
 */
export function zoomInRange(range: NodeRange): NodeRange | null {
  const { $from, $to, depth, start, end } = range
  const doc = $from.doc

  const deeper = (
    $from.pos > start ? $from : doc.resolve(start + 1)
  ).blockRange($to.pos < end ? $to : doc.resolve(end - 1))

  if (deeper && deeper.depth > depth) {
    return deeper
  }

  return null
}

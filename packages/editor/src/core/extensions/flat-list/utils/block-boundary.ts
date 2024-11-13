import { type ResolvedPos } from 'prosemirror-model'

export function atStartBlockBoundary(
  $pos: ResolvedPos,
  depth: number,
): boolean {
  for (let d = depth; d <= $pos.depth; d++) {
    if ($pos.node(d).isTextblock) {
      continue
    }

    const index = $pos.index(d)
    if (index !== 0) {
      return false
    }
  }
  return true
}

export function atEndBlockBoundary($pos: ResolvedPos, depth: number): boolean {
  for (let d = depth; d <= $pos.depth; d++) {
    if ($pos.node(d).isTextblock) {
      continue
    }

    const index = $pos.index(d)
    if (index !== $pos.node(d).childCount - 1) {
      return false
    }
  }
  return true
}

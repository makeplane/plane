import { type Fragment, type Node as ProsemirrorNode } from "@tiptap/pm/model"

// Copy from https://github.com/prosemirror/prosemirror-model/blob/1.19.0/src/replace.ts#L88-L95
export function maxOpenStart(
  fragment: Fragment | ProsemirrorNode,
  openIsolating = true,
) {
  let openStart = 0
  for (
    let n = fragment.firstChild;
    n && !n.isLeaf && (openIsolating || !n.type.spec.isolating);
    n = n.firstChild
  ) {
    openStart++
  }
  return openStart
}

// Copy from https://github.com/prosemirror/prosemirror-model/blob/1.19.0/src/replace.ts#L88-L95
export function maxOpenEnd(
  fragment: Fragment | ProsemirrorNode,
  openIsolating = true,
) {
  let openEnd = 0
  for (
    let n = fragment.lastChild;
    n && !n.isLeaf && (openIsolating || !n.type.spec.isolating);
    n = n.lastChild
  ) {
    openEnd++
  }
  return openEnd
}

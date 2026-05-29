import type { Fragment, Node as ProsemirrorNode, NodeType } from "@tiptap/pm/model";

export function createCell(
  cellType: NodeType,
  cellContent?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>,
  attrs?: Record<string, unknown>
): ProsemirrorNode | null | undefined {
  if (cellContent) {
    return cellType.createChecked(attrs, cellContent);
  }

  return cellType.createAndFill(attrs);
}

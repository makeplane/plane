/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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

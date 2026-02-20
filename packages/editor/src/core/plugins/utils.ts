/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

/** Max distance (px) outside the block edge where the vertical drop indicator is shown */
export const EDGE_OUTSIDE_THRESHOLD = 40;

export function isInsideColumn($pos: ResolvedPos): boolean {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === ADDITIONAL_EXTENSIONS.COLUMN) return true;
  }
  return false;
}

export function isInsideColumnStructure($pos: ResolvedPos): boolean {
  for (let d = $pos.depth; d > 0; d--) {
    const name = $pos.node(d).type.name;
    if (name === ADDITIONAL_EXTENSIONS.COLUMN || name === ADDITIONAL_EXTENSIONS.COLUMN_LIST) return true;
  }
  return false;
}

export function getTargetBlockInfo(
  state: EditorState,
  eventPos: { pos: number; inside: number }
): { pos: number; node: ProseMirrorNode | null } {
  const $pos = state.doc.resolve(eventPos.pos);
  let resolvedPos = $pos;

  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.isBlock && node.type.name !== CORE_EXTENSIONS.DOCUMENT) {
      resolvedPos = state.doc.resolve($pos.before(d));
      break;
    }
  }

  if (resolvedPos.depth > 0 && resolvedPos.parent.type.name === ADDITIONAL_EXTENSIONS.COLUMN) {
    resolvedPos = state.doc.resolve(resolvedPos.before());
  }
  return { pos: resolvedPos.pos, node: resolvedPos.nodeAfter };
}

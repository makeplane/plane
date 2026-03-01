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

import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
// constants
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

export function handleBackspaceInColumnList(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from, empty } = selection;

  // Only handle empty selections
  if (!empty) return false;

  // Check if we're at the start of a block that comes right after a columnList
  const pos = $from.pos;
  const $pos = state.doc.resolve(pos);

  // Check if cursor is at the very start of its parent block
  const parentStart = $pos.start($pos.depth);
  if (pos !== parentStart) return false;

  // Look for a columnList node before the current position
  const before = $pos.before($pos.depth);
  if (before < 1) return false;

  const nodeBefore = state.doc.resolve(before).nodeBefore;
  if (!nodeBefore || nodeBefore.type.name !== (ADDITIONAL_EXTENSIONS.COLUMN_LIST as string)) {
    return false;
  }

  // Find the position at the end of the columnList (just before it closes)
  // This is: before - 1 (end of columnList content)
  const endOfColumnList = before - 1;

  // Use TextSelection.near to find the nearest valid cursor position
  const $end = state.doc.resolve(endOfColumnList);
  const newSelection = TextSelection.near($end, -1);

  const tr = state.tr;
  tr.setSelection(newSelection);
  editor.view.dispatch(tr);

  return true;
}

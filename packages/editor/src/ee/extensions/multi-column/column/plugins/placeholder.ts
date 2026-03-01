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

import { Placeholder } from "@tiptap/extension-placeholder";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
import { MultiColumnPlaceholderExtensionName } from "../../types";

export const MultiColumnPlaceholderExtension = Placeholder.extend({
  name: MultiColumnPlaceholderExtensionName,
}).configure({
  placeholder: ({ editor, node, pos }) => {
    if (!editor.isEditable) return "";

    if (node.type.name !== (CORE_EXTENSIONS.PARAGRAPH as string)) {
      return "";
    }

    const $pos = editor.state.doc.resolve(pos);
    let columnNode = null;
    let columnDepth = -1;

    for (let depth = $pos.depth; depth > 0; depth--) {
      const ancestorNode = $pos.node(depth);
      if (ancestorNode.type.name === (ADDITIONAL_EXTENSIONS.COLUMN as string)) {
        columnNode = ancestorNode;
        columnDepth = depth;
        break;
      }
    }

    if (columnDepth > 0 && columnNode) {
      // Check if column has only one child and it's an empty paragraph
      const isColumnEmpty =
        columnNode.childCount === 1 &&
        columnNode.firstChild?.type.name === (CORE_EXTENSIONS.PARAGRAPH as string) &&
        columnNode.firstChild?.content.size === 0;

      if (isColumnEmpty) {
        return "add content";
      }
    }

    return "";
  },
  includeChildren: true,
  showOnlyCurrent: false,
});

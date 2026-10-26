/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { TextStyle } from "@tiptap/extension-text-style";

// Preserve v2 parsing while retaining the existing textStyle mark and attributes.
export const CustomTextStyle = TextStyle.extend({
  parseHTML() {
    return (this.parent?.() ?? []).map(({ consuming: _consuming, ...rule }) => rule);
  },
}).configure({ mergeNestedSpanStyles: false });

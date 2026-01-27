/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// editor
import type { TExtensions } from "@plane/editor";

export type TEditorFlaggingHookReturnType = {
  document: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
  liteText: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
  richText: {
    disabled: TExtensions[];
    flagged: TExtensions[];
  };
};

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (anchor: string): TEditorFlaggingHookReturnType => ({
  document: {
    disabled: [],
    flagged: [],
  },
  liteText: {
    disabled: [],
    flagged: [],
  },
  richText: {
    disabled: [],
    flagged: [],
  },
});

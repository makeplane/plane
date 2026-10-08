/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type TFileNode = ProseMirrorNode & {
  attrs: {
    src: string;
    id: string;
  };
};

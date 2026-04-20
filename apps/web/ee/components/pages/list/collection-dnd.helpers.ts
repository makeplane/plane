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

import type { TPage } from "@plane/types";

export type TCollectionDropPosition = "before" | "after" | "inside";

export const getCollectionMoveTargetParentId = (
  position: TCollectionDropPosition,
  targetPage: { id: string; parent_id?: TPage["parent_id"] }
): string | null => (position === "inside" ? targetPage.id : (targetPage.parent_id ?? null));

export const isCollectionMoveTargetWithinDraggedSubtree = (
  draggedPageId: string,
  targetParentId: string | null,
  getParentId: (pageId: string) => string | null | undefined
): boolean => {
  let currentParentId = targetParentId;

  while (currentParentId) {
    if (currentParentId === draggedPageId) {
      return true;
    }

    currentParentId = getParentId(currentParentId) ?? null;
  }

  return false;
};

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

export const WORK_ITEM_HIERARCHY_DRAG_KEY = "workItemTypeHierarchyDrag";

export type TWorkItemHierarchyDragData = {
  [WORK_ITEM_HIERARCHY_DRAG_KEY]: true;
  workItemTypeId: string;
  sourceLevel: number;
};

export function getWorkItemHierarchyDragData(workItemTypeId: string, sourceLevel: number): TWorkItemHierarchyDragData {
  return {
    [WORK_ITEM_HIERARCHY_DRAG_KEY]: true,
    workItemTypeId,
    sourceLevel,
  };
}

export function isWorkItemHierarchyDragData(
  data: Record<string | symbol, unknown>
): data is TWorkItemHierarchyDragData {
  return data[WORK_ITEM_HIERARCHY_DRAG_KEY] === true;
}

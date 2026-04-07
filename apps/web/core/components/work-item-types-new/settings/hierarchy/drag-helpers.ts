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

// plane imports
import { setPromiseToast } from "@plane/propel/toast";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";

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

export function handleWorkItemHierarchyDrop(
  workItemType: BaseWorkItemTypeInstanceSchema,
  targetLevel: number,
  t: (key: string, options?: Record<string, unknown>) => string
): void {
  const promise = workItemType.updateType({ level: targetLevel }, false);
  setPromiseToast(promise, {
    loading: t("work_item_type_hierarchy.levels.add_to_level_toast.loading", {
      workItemTypeName: workItemType.name,
      level: targetLevel,
    }),
    success: {
      title: t("work_item_type_hierarchy.levels.add_to_level_toast.success.title"),
      message: () =>
        t("work_item_type_hierarchy.levels.add_to_level_toast.success.message", {
          workItemTypeName: workItemType.name,
          level: targetLevel,
        }),
    },
    error: {
      title: t("work_item_type_hierarchy.levels.add_to_level_toast.error.title"),
      message: () =>
        t("work_item_type_hierarchy.levels.add_to_level_toast.error.message", {
          workItemTypeName: workItemType.name,
          level: targetLevel,
        }),
    },
  });
  promise
    .then(() =>
      workItemType.mutateProperties({
        level: targetLevel,
      })
    )
    .catch((error) => {
      console.error(error);
    });
}

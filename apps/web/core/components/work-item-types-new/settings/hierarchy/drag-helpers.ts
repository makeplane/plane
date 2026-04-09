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
import { dismissToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { WorkspaceWorkItemTypesService } from "@plane/services";
import type { BaseWorkItemTypeInstanceSchema, TValidateLevelChangeResponse } from "@plane/types";

export const WORK_ITEM_HIERARCHY_DRAG_KEY = "workItemTypeHierarchyDrag";
const workspaceWorkItemTypesService = new WorkspaceWorkItemTypesService();

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

type HandleWorkItemHierarchyDropArgs = {
  onProcessingChange?: (processing: boolean) => void;
  onValidationError: (data: TValidateLevelChangeResponse) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  targetLevel: number;
  workItemType: BaseWorkItemTypeInstanceSchema;
  workspaceSlug: string;
};

export async function handleWorkItemHierarchyDrop({
  onProcessingChange,
  onValidationError,
  t,
  targetLevel,
  workItemType,
  workspaceSlug,
}: HandleWorkItemHierarchyDropArgs): Promise<void> {
  onProcessingChange?.(true);
  const loadingToastId = setToast({
    type: TOAST_TYPE.LOADING,
    title: t("work_item_type_hierarchy.levels.update_level_toast.loading", {
      workItemTypeName: workItemType.name,
      level: targetLevel,
    }),
  });
  const makeRequests = async () => {
    const res = await workspaceWorkItemTypesService.validateLevelChange(workspaceSlug, {
      type_id: workItemType.id,
      level: targetLevel,
    });
    if (!res) throw new Error("Failed to validate level change");

    if (res.total_violations > 0) {
      onValidationError(res);
      throw new Error("Hierarchy validation failed");
    } else {
      await workItemType.updateType({ level: targetLevel }, false);
      workItemType.mutateProperties({
        level: targetLevel,
      });
    }
  };
  try {
    await makeRequests();
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("work_item_type_hierarchy.levels.update_level_toast.success.title"),
      message: t("work_item_type_hierarchy.levels.update_level_toast.success.message", {
        workItemTypeName: workItemType.name,
        level: targetLevel,
      }),
    });
  } catch (error) {
    console.error("Error in handling work item hierarchy drop:", error);
  } finally {
    dismissToast(loadingToastId);
    onProcessingChange?.(false);
  }
}

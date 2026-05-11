/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EProjectFieldPermissionKey } from "@plane/types";
// hooks
import { useProjectFieldPermission } from "@/hooks/store/use-project-field-permission";
import { useUserPermissions } from "@/hooks/store/user";

/**
 * Returns whether a work-item field is locked for the current user.
 *
 * Lock semantics (Validation #7):
 *  - Date fields: members MAY set a value when currentValue is null/undefined
 *    (first-time fill). Modifying an existing value is blocked when locked.
 *  - Delete action: pure role/toggle check — pass currentValue=undefined.
 *
 * Admins (project-admin OR workspace-admin) are never locked.
 */
export const useWorkItemFieldLock = (
  fieldKey: EProjectFieldPermissionKey,
  currentValue?: unknown
): { isLocked: boolean } => {
  const { workspaceSlug, projectId } = useParams();
  const { canMemberAction } = useProjectFieldPermission();
  const { allowPermissions } = useUserPermissions();

  const slug = workspaceSlug?.toString() ?? "";
  const pid = projectId?.toString() ?? "";

  const isProjectAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, slug, pid);
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, slug);
  const isAdmin = isProjectAdmin || isWorkspaceAdmin;

  const canMember = canMemberAction(slug, pid, fieldKey);

  // For date fields (non-delete): allow fill when current value is null/undefined.
  const isDateField = fieldKey !== EProjectFieldPermissionKey.DELETE_WORK_ITEM;
  const allowFillEmpty = isDateField && (currentValue === null || currentValue === undefined);

  return { isLocked: !isAdmin && !canMember && !allowFillEmpty };
};

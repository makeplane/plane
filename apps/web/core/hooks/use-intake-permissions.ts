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

import { EUserPermissions, EUserPermissionsLevel, INTAKE_ACTIONABLE_STATUSES } from "@plane/constants";
import type { IInboxIssueStore } from "@plane/types";
import { useUser, useUserPermissions } from "@/hooks/store/user";

type TIntakePermissions = {
  isEditable: boolean;
  canDelete: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canMarkAsDuplicate: boolean;
  isProjectAdmin: boolean;
  isAllowed: boolean;
  readOnly: boolean;
};

/**
 * Custom hook to centralize intake/inbox issue permission logic
 *
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project ID
 * @param inboxIssue - The inbox/intake issue store object
 * @returns Object containing various permission flags
 */
export const useIntakePermissions = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  inboxIssue: IInboxIssueStore | undefined
): TIntakePermissions => {
  const { data: currentUser } = useUser();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();

  // Return safe defaults if required parameters are missing
  if (!workspaceSlug || !projectId) {
    return {
      isEditable: false,
      canDelete: false,
      canAccept: false,
      canDecline: false,
      canMarkAsDuplicate: false,
      isProjectAdmin: false,
      isAllowed: false,
      readOnly: true,
    };
  }

  // Check if user is project admin
  const isProjectAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // Check if user is allowed (admin or member)
  const isAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // Check ownership and guest status
  const isOwner = inboxIssue?.issue?.created_by === currentUser?.id;
  const isGuest = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.GUEST;
  const readOnly = !isOwner && isGuest;

  // Delete permission: admin or owner
  const canDelete = isProjectAdmin || isOwner;

  // Edit permission: admin or owner
  const isEditable = isProjectAdmin || isOwner;

  // Can only perform actions (accept/decline/duplicate) on pending or snoozed issues
  const isActionable =
    inboxIssue?.status !== undefined && (INTAKE_ACTIONABLE_STATUSES as readonly number[]).includes(inboxIssue.status);

  return {
    isEditable,
    canDelete,
    canAccept: isAllowed && isActionable,
    canDecline: isAllowed && isActionable,
    canMarkAsDuplicate: isAllowed && isActionable,
    isProjectAdmin,
    isAllowed,
    readOnly,
  };
};

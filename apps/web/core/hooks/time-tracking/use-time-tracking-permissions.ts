/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { EUserPermissions } from "@plane/constants";
import type { IUserProjectsRole } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

const NO_ROLES: IUserProjectsRole = {};

/**
 * Mirrors the server's rules (plan 6.1) to decide what UI to show.
 * The server stays authoritative: rows carry their own `can_edit`.
 */
export const useTimeTrackingPermissions = (workspaceSlugOverride?: string) => {
  const params = useParams();
  const workspaceSlug = workspaceSlugOverride ?? params.workspaceSlug?.toString() ?? "";
  const { getWorkspaceRoleByWorkspaceSlug, getProjectRolesByWorkspaceSlug } = useUserPermissions();
  const { getPartialProjectById } = useProject();

  const workspaceRole = workspaceSlug ? getWorkspaceRoleByWorkspaceSlug(workspaceSlug) : undefined;
  // computedFn keeps this reference stable between renders; the fallback must be stable too
  const projectRoles = (workspaceSlug ? getProjectRolesByWorkspaceSlug(workspaceSlug) : undefined) ?? NO_ROLES;

  /** workspace Admins and Members; Guests don't see time tracking (A1) */
  const canView = workspaceRole === EUserPermissions.ADMIN || workspaceRole === EUserPermissions.MEMBER;
  const isWorkspaceAdmin = workspaceRole === EUserPermissions.ADMIN;

  const isLive = useCallback(
    (projectId: string) => {
      const project = getPartialProjectById(projectId);
      return !!project && !project.archived_at;
    },
    [getPartialProjectById]
  );

  const canLogOwn = useCallback(
    (projectId: string | null | undefined) =>
      !!projectId &&
      canView &&
      isLive(projectId) &&
      (projectRoles?.[projectId] === EUserPermissions.ADMIN || projectRoles?.[projectId] === EUserPermissions.MEMBER),
    [canView, isLive, projectRoles]
  );

  const canLogForOthers = useCallback(
    (projectId: string | null | undefined) =>
      !!projectId &&
      canView &&
      isLive(projectId) &&
      (isWorkspaceAdmin || projectRoles?.[projectId] === EUserPermissions.ADMIN),
    [canView, isLive, isWorkspaceAdmin, projectRoles]
  );

  const canManageSettings = useCallback(
    (projectId: string | null | undefined) =>
      !!projectId && canView && (isWorkspaceAdmin || projectRoles?.[projectId] === EUserPermissions.ADMIN),
    [canView, isWorkspaceAdmin, projectRoles]
  );

  return { workspaceSlug, canView, isWorkspaceAdmin, canLogOwn, canLogForOthers, canManageSettings };
};

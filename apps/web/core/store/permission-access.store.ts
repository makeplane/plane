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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { RolesAndPermissionsService } from "@plane/services";
import type { CurrentUserPermissionState, PermissionCheckArgs, PermissionConditionContext } from "@plane/types";
import { buildPermissionString, matchesPermissionGrant } from "@plane/utils";

/**
 * Runtime access-evaluation store for the current user.
 *
 * Responsibilities:
 * - hold fetched workspace/project/teamspace grant snapshots
 * - expose relation helpers for UI gates
 * - provide a typed `can()` evaluator
 */
export interface IPermissionAccessStore {
  can: (args: PermissionCheckArgs) => boolean;
  getCurrentUserWorkspaceRoleSlug: (workspaceSlug: string) => CurrentUserPermissionState["relation"] | undefined;
  getCurrentUserProjectRoleSlug: (projectId: string) => CurrentUserPermissionState["relation"] | undefined;
  getCurrentUserTeamspaceRoleSlug: (teamspaceId: string) => CurrentUserPermissionState["relation"] | undefined;
  fetchCurrentUserWorkspacePermissions: (workspaceSlug: string) => Promise<void>;
  hydrateProjectPermissionsFromEntities: (entities: TPermissionHydrationEntity[]) => void;
  hydrateTeamspacePermissionsFromEntities: (entities: TPermissionHydrationEntity[]) => void;
}

type TPermissionHydrationEntity = {
  id: string;
  _permissions: CurrentUserPermissionState;
};

/**
 * Store for current-user permission access checks.
 */
export class PermissionAccessStore implements IPermissionAccessStore {
  private workspacePermissionsMap: Map<string, CurrentUserPermissionState> = new Map();
  private projectPermissionsMap: Map<string, CurrentUserPermissionState> = new Map();
  private teamspacePermissionsMap: Map<string, CurrentUserPermissionState> = new Map();

  private service: RolesAndPermissionsService;

  constructor() {
    makeObservable<
      PermissionAccessStore,
      "workspacePermissionsMap" | "projectPermissionsMap" | "teamspacePermissionsMap"
    >(this, {
      workspacePermissionsMap: observable,
      projectPermissionsMap: observable,
      teamspacePermissionsMap: observable,
      fetchCurrentUserWorkspacePermissions: action,
      hydrateProjectPermissionsFromEntities: action,
      hydrateTeamspacePermissionsFromEntities: action,
    });

    this.service = new RolesAndPermissionsService();
  }

  /**
   * Resolves derived check context from union args.
   *
   * Subtle path: for `resource === "project"` instance actions, `projectId` can be
   * inferred from `resourceMeta.resourceId` when not passed explicitly.
   * Same inference is applied for `resource === "teamspace"` and `teamspaceId`.
   */
  private resolvePermissionCheckArgs = (
    args: PermissionCheckArgs
  ): {
    projectId: string | undefined;
    teamspaceId: string | undefined;
    conditionContext: PermissionConditionContext | undefined;
  } => {
    const resourceMeta = "resourceMeta" in args ? args.resourceMeta : undefined;
    const projectId = "projectId" in args ? args.projectId : undefined;
    const teamspaceId = "teamspaceId" in args ? args.teamspaceId : undefined;
    const conditionContext = resourceMeta?.conditionContext;

    if (projectId || teamspaceId) return { projectId, teamspaceId, conditionContext };

    if (args.resource === "project" && resourceMeta?.resourceId) {
      return {
        projectId: resourceMeta.resourceId,
        teamspaceId,
        conditionContext,
      };
    }

    if (args.resource === "teamspace" && resourceMeta?.resourceId) {
      return {
        projectId,
        teamspaceId: resourceMeta.resourceId,
        conditionContext,
      };
    }

    return { projectId, teamspaceId, conditionContext };
  };

  /**
   * Evaluates permission access.
   *
   * Resolution order:
   * 1. project-scoped grants when a project context is available
   * 2. teamspace-scoped grants when a teamspace context is available
   * 3. workspace-scoped grants as fallback/default scope
   */
  can: IPermissionAccessStore["can"] = computedFn((args: PermissionCheckArgs) => {
    const { resource, action: permissionAction, workspaceSlug } = args;
    const { projectId, teamspaceId, conditionContext } = this.resolvePermissionCheckArgs(args);
    const permissionToCheck = buildPermissionString({
      resource,
      action: permissionAction,
    });

    if (projectId) {
      const projectPermissions = this.projectPermissionsMap.get(projectId)?.permission_grants;
      if (projectPermissions) {
        const matches = matchesPermissionGrant({
          permissions: projectPermissions,
          permissionToCheck,
          conditionContext,
        });
        if (matches) return true;
      }
    }

    if (teamspaceId) {
      const teamspacePermissions = this.teamspacePermissionsMap.get(teamspaceId)?.permission_grants;
      if (teamspacePermissions) {
        const matches = matchesPermissionGrant({
          permissions: teamspacePermissions,
          permissionToCheck,
          conditionContext,
        });
        if (matches) return true;
      }
    }

    const workspacePermissions = this.workspacePermissionsMap.get(workspaceSlug)?.permission_grants;
    if (!workspacePermissions) return false;

    return matchesPermissionGrant({
      permissions: workspacePermissions,
      permissionToCheck,
      conditionContext,
    });
  });

  getCurrentUserWorkspaceRoleSlug: IPermissionAccessStore["getCurrentUserWorkspaceRoleSlug"] = computedFn(
    (workspaceSlug) => this.workspacePermissionsMap.get(workspaceSlug)?.relation
  );

  getCurrentUserProjectRoleSlug: IPermissionAccessStore["getCurrentUserProjectRoleSlug"] = computedFn(
    (projectId) => this.projectPermissionsMap.get(projectId)?.relation
  );

  getCurrentUserTeamspaceRoleSlug: IPermissionAccessStore["getCurrentUserTeamspaceRoleSlug"] = computedFn(
    (teamspaceId) => this.teamspacePermissionsMap.get(teamspaceId)?.relation
  );

  fetchCurrentUserWorkspacePermissions: IPermissionAccessStore["fetchCurrentUserWorkspacePermissions"] = async (
    workspaceSlug
  ) => {
    try {
      const permissions = await this.service.retrieveWorkspacePermissions(workspaceSlug);
      runInAction(() => {
        this.workspacePermissionsMap.set(workspaceSlug, permissions);
      });
    } catch (error) {
      console.error("Failed to fetch workspace permissions:", error);
      throw error;
    }
  };

  hydrateProjectPermissionsFromEntities: IPermissionAccessStore["hydrateProjectPermissionsFromEntities"] = action(
    (entities) => {
      entities.forEach((entity) => {
        if (!entity._permissions) return;
        this.projectPermissionsMap.set(entity.id, entity._permissions);
      });
    }
  );

  hydrateTeamspacePermissionsFromEntities: IPermissionAccessStore["hydrateTeamspacePermissionsFromEntities"] = action(
    (entities) => {
      entities.forEach((entity) => {
        if (!entity._permissions) return;
        this.teamspacePermissionsMap.set(entity.id, entity._permissions);
      });
    }
  );
}

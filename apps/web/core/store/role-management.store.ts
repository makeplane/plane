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
import type {
  CreateRolePayload,
  PermissionNamespace,
  PermissionRole,
  RoleStatusFilter,
  UpdateRolePayload,
} from "@plane/types";

/**
 * Role-catalog management store.
 *
 * Responsibilities:
 * - cache workspace/project role lists
 * - provide role lookup helpers by id/slug/namespace
 * - perform role CRUD and keep maps synchronized
 *
 * Note:
 * Teamspace namespace is currently handled in permission-evaluation flows only.
 * Role-management UI/store remains workspace+project scoped and needs to be updated to support teamspace.
 */
export interface IRoleManagementStore {
  /**
   * Role-list getters require an explicit `statusFilter` so every call site
   * consciously picks between active / inactive / all. Disabled roles must
   * not leak into selection UIs by default.
   */
  getWorkspaceRoleIdsByWorkspaceSlug: (workspaceSlug: string, statusFilter: RoleStatusFilter) => string[] | undefined;
  getProjectRoleIdsByWorkspaceSlug: (workspaceSlug: string, statusFilter: RoleStatusFilter) => string[] | undefined;
  getWorkspaceRolesByWorkspaceSlug: (workspaceSlug: string, statusFilter: RoleStatusFilter) => PermissionRole[];
  getProjectRolesByWorkspaceSlug: (workspaceSlug: string, statusFilter: RoleStatusFilter) => PermissionRole[];
  getRoleDetailsByRoleSlug: (args: {
    workspaceSlug: string;
    roleSlug: string;
    namespace: PermissionNamespace;
  }) => PermissionRole | undefined;
  getWorkspaceRoleDetailsByRoleSlug: (workspaceSlug: string, roleSlug: string) => PermissionRole | undefined;
  getProjectRoleDetailsByRoleSlug: (workspaceSlug: string, roleSlug: string) => PermissionRole | undefined;
  getRoleDetailsByRoleId: (roleId: string) => PermissionRole | undefined;
  getRoleNamespaceByRoleId: (roleId: string) => PermissionNamespace | undefined;
  fetchAllWorkspaceRoles: (workspaceSlug: string) => Promise<void>;
  createRole: (args: { workspaceSlug: string; data: CreateRolePayload }) => Promise<PermissionRole>;
  updateRole: (args: { workspaceSlug: string; roleId: string; data: UpdateRolePayload }) => Promise<void>;
  deleteRole: (args: { workspaceSlug: string; roleId: string; reassignTo?: string }) => Promise<void>;
  disableRole: (args: { workspaceSlug: string; roleId: string; reassignTo?: string }) => Promise<void>;
  enableRole: (args: { workspaceSlug: string; roleId: string }) => Promise<void>;
}

/**
 * Store for role definitions (not current-user access checks).
 */
export class RoleManagementStore implements IRoleManagementStore {
  private rolesMap: Map<string, PermissionRole> = new Map();
  private workspaceRoleIdsMap: Map<string, string[]> = new Map();
  private projectRoleIdsMap: Map<string, string[]> = new Map();
  private roleIdToNamespaceMap: Map<string, PermissionNamespace> = new Map();

  private service: RolesAndPermissionsService;

  /**
   * Returns the in-memory role-id map supported by this store for a namespace.
   * Teamspace namespace intentionally has no list map yet (eval-only rollout).
   */
  private getRoleIdsMapByNamespace = computedFn((namespace: PermissionNamespace) => {
    if (namespace === "workspace") return this.workspaceRoleIdsMap;
    if (namespace === "project") return this.projectRoleIdsMap;
    return undefined;
  });

  constructor() {
    makeObservable<
      RoleManagementStore,
      "rolesMap" | "workspaceRoleIdsMap" | "projectRoleIdsMap" | "roleIdToNamespaceMap"
    >(this, {
      rolesMap: observable,
      workspaceRoleIdsMap: observable,
      projectRoleIdsMap: observable,
      roleIdToNamespaceMap: observable,
      fetchAllWorkspaceRoles: action,
      createRole: action,
      updateRole: action,
      deleteRole: action,
      disableRole: action,
      enableRole: action,
    });

    this.service = new RolesAndPermissionsService();
  }

  private matchesStatusFilter = (role: PermissionRole, statusFilter: RoleStatusFilter): boolean => {
    if (statusFilter === "all") return true;
    return role.status === statusFilter;
  };

  /**
   * Returns full PermissionRole objects for workspace/project roles.
   * Useful when callers need both slug and name without a second lookup.
   */
  getWorkspaceRolesByWorkspaceSlug: IRoleManagementStore["getWorkspaceRolesByWorkspaceSlug"] = computedFn(
    (workspaceSlug, statusFilter) => {
      const ids = this.workspaceRoleIdsMap.get(workspaceSlug);
      if (!ids) return [];
      return ids
        .map((id) => this.rolesMap.get(id))
        .filter((r): r is PermissionRole => !!r && this.matchesStatusFilter(r, statusFilter));
    }
  );

  getProjectRolesByWorkspaceSlug: IRoleManagementStore["getProjectRolesByWorkspaceSlug"] = computedFn(
    (workspaceSlug, statusFilter) => {
      const ids = this.projectRoleIdsMap.get(workspaceSlug);
      if (!ids) return [];
      return ids
        .map((id) => this.rolesMap.get(id))
        .filter((r): r is PermissionRole => !!r && this.matchesStatusFilter(r, statusFilter));
    }
  );

  /**
   * Id-only variants for callers that just need the list of role ids.
   * Returns `undefined` before the namespace has been fetched (so callers can
   * distinguish "not loaded" from "loaded but empty").
   */
  getWorkspaceRoleIdsByWorkspaceSlug: IRoleManagementStore["getWorkspaceRoleIdsByWorkspaceSlug"] = computedFn(
    (workspaceSlug, statusFilter) => {
      if (!this.workspaceRoleIdsMap.has(workspaceSlug)) return undefined;
      return this.getWorkspaceRolesByWorkspaceSlug(workspaceSlug, statusFilter).map((r) => r.id);
    }
  );

  getProjectRoleIdsByWorkspaceSlug: IRoleManagementStore["getProjectRoleIdsByWorkspaceSlug"] = computedFn(
    (workspaceSlug, statusFilter) => {
      if (!this.projectRoleIdsMap.has(workspaceSlug)) return undefined;
      return this.getProjectRolesByWorkspaceSlug(workspaceSlug, statusFilter).map((r) => r.id);
    }
  );

  getRoleDetailsByRoleSlug: IRoleManagementStore["getRoleDetailsByRoleSlug"] = computedFn((args) => {
    const { workspaceSlug, roleSlug, namespace } = args;
    const roleIdsMap = this.getRoleIdsMapByNamespace(namespace);
    if (!roleIdsMap) return undefined;

    const roleIds = roleIdsMap.get(workspaceSlug);
    const roleId = roleIds?.find((id) => this.getRoleDetailsByRoleId(id)?.slug === roleSlug);
    return this.getRoleDetailsByRoleId(roleId!);
  });

  getWorkspaceRoleDetailsByRoleSlug: IRoleManagementStore["getWorkspaceRoleDetailsByRoleSlug"] = computedFn(
    (workspaceSlug, roleSlug) => {
      const roleIds = this.workspaceRoleIdsMap.get(workspaceSlug);
      if (!roleIds) return undefined;
      const roleId = roleIds.find((id) => this.getRoleDetailsByRoleId(id)?.slug === roleSlug);
      return this.getRoleDetailsByRoleId(roleId!);
    }
  );

  getProjectRoleDetailsByRoleSlug: IRoleManagementStore["getProjectRoleDetailsByRoleSlug"] = computedFn(
    (workspaceSlug, roleSlug) => {
      const roleIds = this.projectRoleIdsMap.get(workspaceSlug);
      if (!roleIds) return undefined;
      const roleId = roleIds.find((id) => this.getRoleDetailsByRoleId(id)?.slug === roleSlug);
      return this.getRoleDetailsByRoleId(roleId!);
    }
  );

  getRoleDetailsByRoleId: IRoleManagementStore["getRoleDetailsByRoleId"] = computedFn((roleId) =>
    this.rolesMap.get(roleId)
  );

  getRoleNamespaceByRoleId: IRoleManagementStore["getRoleNamespaceByRoleId"] = computedFn((roleId) =>
    this.roleIdToNamespaceMap.get(roleId)
  );

  /**
   * Applies an in-memory patch on a cached role.
   * Used by optimistic update/revert flows.
   */
  private mutateRole = (args: { roleId: string; data: Partial<PermissionRole> }) => {
    const { roleId, data } = args;
    const roleDetails = this.getRoleDetailsByRoleId(roleId);
    if (!roleDetails) return;

    runInAction(() => {
      this.rolesMap.set(roleId, {
        ...roleDetails,
        ...data,
      });
    });
  };

  /**
   * Adjust a role's member_count by `delta`. No-op if role is missing.
   */
  private adjustRoleMemberCount = (roleId: string, delta: number) => {
    const role = this.getRoleDetailsByRoleId(roleId);
    if (!role) return;
    this.mutateRole({ roleId, data: { member_count: role.member_count + delta } });
  };

  /**
   * Restore a previously-removed role back into the rolesMap, namespace list,
   * and namespace lookup at its original position. Used to revert an
   * optimistic delete when the API call fails.
   */
  private restoreRole = (
    snapshot: PermissionRole,
    namespace: PermissionNamespace,
    workspaceSlug: string,
    index: number
  ) => {
    runInAction(() => {
      this.rolesMap.set(snapshot.id, snapshot);
      this.roleIdToNamespaceMap.set(snapshot.id, namespace);

      const idsMap = this.getRoleIdsMapByNamespace(namespace);
      if (!idsMap) return;

      const ids = [...(idsMap.get(workspaceSlug) ?? [])];
      if (!ids.includes(snapshot.id)) {
        ids.splice(index, 0, snapshot.id);
        idsMap.set(workspaceSlug, ids);
      }
    });
  };

  fetchAllWorkspaceRoles: IRoleManagementStore["fetchAllWorkspaceRoles"] = async (workspaceSlug) => {
    try {
      const [workspaceRoles, projectRoles] = await Promise.all([
        this.service.listRoles(workspaceSlug, "workspace"),
        this.service.listRoles(workspaceSlug, "project"),
      ]);

      runInAction(() => {
        const workspaceRoleIds: string[] = [];
        workspaceRoles.forEach((role) => {
          this.rolesMap.set(role.id, role);
          this.roleIdToNamespaceMap.set(role.id, "workspace");
          if (!workspaceRoleIds.includes(role.id)) {
            workspaceRoleIds.push(role.id);
          }
        });

        const projectRoleIds: string[] = [];
        projectRoles.forEach((role) => {
          this.rolesMap.set(role.id, role);
          this.roleIdToNamespaceMap.set(role.id, "project");
          if (!projectRoleIds.includes(role.id)) {
            projectRoleIds.push(role.id);
          }
        });

        this.workspaceRoleIdsMap.set(workspaceSlug, workspaceRoleIds);
        this.projectRoleIdsMap.set(workspaceSlug, projectRoleIds);
      });
    } catch (error) {
      console.error("Failed to fetch all workspace roles:", error);
      throw error;
    }
  };

  createRole: IRoleManagementStore["createRole"] = async (args) => {
    const { workspaceSlug, data } = args;
    const namespace = data.namespace;
    try {
      const response = await this.service.createRole(workspaceSlug, data);
      runInAction(() => {
        this.rolesMap.set(response.id, response);
        this.roleIdToNamespaceMap.set(response.id, namespace);

        const existingRoleIdsMap = this.getRoleIdsMapByNamespace(namespace);
        if (!existingRoleIdsMap) return;

        const existingWorkspaceRoleIds = existingRoleIdsMap.get(workspaceSlug) || [];
        existingRoleIdsMap.set(workspaceSlug, [...existingWorkspaceRoleIds, response.id]);
      });
      return response;
    } catch (error) {
      console.error("Failed to create role:", error);
      throw error;
    }
  };

  updateRole: IRoleManagementStore["updateRole"] = async (args) => {
    const { workspaceSlug, roleId, data } = args;
    const roleDetails = this.getRoleDetailsByRoleId(roleId);

    try {
      if (!roleDetails) {
        throw new Error(`Role with ID ${roleId} not found in workspace ${workspaceSlug}`);
      }

      // Optimistic local patch with only the fields that overlap with the read type.
      const { name, description, status, sort_order } = data;
      this.mutateRole({ roleId, data: { name, description, status, sort_order } });
      const response = await this.service.updateRole(workspaceSlug, roleId, data);
      // Replace the optimistic patch with the full API response so that nested
      // objects (e.g. permission_schemes) are stored as complete refs, not just
      // the UUID strings that were sent in the request payload.
      runInAction(() => {
        this.rolesMap.set(roleId, response);
      });
    } catch (error) {
      if (roleDetails) {
        // Revert optimistic patch if the API call fails.
        this.mutateRole({ roleId, data: roleDetails });
      }
      console.error("Failed to update role:", error);
      throw error;
    }
  };

  deleteRole: IRoleManagementStore["deleteRole"] = async (args) => {
    const { workspaceSlug, roleId, reassignTo } = args;
    const sourceSnapshot = this.getRoleDetailsByRoleId(roleId);
    const targetSnapshot = reassignTo ? this.getRoleDetailsByRoleId(reassignTo) : undefined;
    const namespace = this.roleIdToNamespaceMap.get(roleId);
    const idsMap = namespace ? this.getRoleIdsMapByNamespace(namespace) : undefined;
    const sourceIndex = idsMap?.get(workspaceSlug)?.indexOf(roleId) ?? -1;

    // Optimistic remove + forward members to reassign target.
    runInAction(() => {
      this.rolesMap.delete(roleId);
      this.roleIdToNamespaceMap.delete(roleId);
      if (idsMap) {
        const ids = idsMap.get(workspaceSlug) ?? [];
        idsMap.set(
          workspaceSlug,
          ids.filter((id) => id !== roleId)
        );
      }
    });
    if (reassignTo && sourceSnapshot) {
      this.adjustRoleMemberCount(reassignTo, sourceSnapshot.member_count);
    }

    try {
      await this.service.destroyRole(workspaceSlug, roleId, reassignTo);
    } catch (error) {
      // Revert: reinsert source role, undo target bump.
      if (sourceSnapshot && namespace && sourceIndex >= 0) {
        this.restoreRole(sourceSnapshot, namespace, workspaceSlug, sourceIndex);
      }
      if (reassignTo && targetSnapshot && sourceSnapshot) {
        this.adjustRoleMemberCount(reassignTo, -sourceSnapshot.member_count);
      }
      console.error("Failed to delete role:", error);
      throw error;
    }
  };

  disableRole: IRoleManagementStore["disableRole"] = async (args) => {
    const { workspaceSlug, roleId, reassignTo } = args;
    const sourceSnapshot = this.getRoleDetailsByRoleId(roleId);
    if (!sourceSnapshot) return;

    const targetSnapshot = reassignTo ? this.getRoleDetailsByRoleId(reassignTo) : undefined;

    // Optimistic: source → inactive + zero member_count; target gains the members.
    this.mutateRole({ roleId, data: { status: "inactive", member_count: 0 } });
    if (reassignTo) {
      this.adjustRoleMemberCount(reassignTo, sourceSnapshot.member_count);
    }

    try {
      await this.service.updateRole(workspaceSlug, roleId, {
        status: "inactive",
        reassign_to: reassignTo,
      });
    } catch (error) {
      // Revert both sides on failure.
      this.mutateRole({ roleId, data: sourceSnapshot });
      if (reassignTo && targetSnapshot) {
        this.mutateRole({ roleId: reassignTo, data: targetSnapshot });
      }
      console.error("Failed to disable role:", error);
      throw error;
    }
  };

  enableRole: IRoleManagementStore["enableRole"] = async (args) => {
    const { workspaceSlug, roleId } = args;
    try {
      await this.service.updateRole(workspaceSlug, roleId, { status: "active" });
      runInAction(() => {
        const role = this.rolesMap.get(roleId);
        if (role) {
          this.rolesMap.set(roleId, { ...role, status: "active" });
        }
      });
    } catch (error) {
      console.error("Failed to enable role:", error);
      throw error;
    }
  };
}

import { computedFn } from "mobx-utils";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { getHighestRole } from "@plane/utils";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
// store
import { BaseUserPermissionStore, IBaseUserPermissionStore } from "@/store/user/base-permissions.store";

export type IUserPermissionStore = IBaseUserPermissionStore;

export class UserPermissionStore extends BaseUserPermissionStore implements IUserPermissionStore {
  constructor(store: RootStore) {
    super(store);
  }

  /**
   * @description Returns the project membership permission from the teamspace
   * @description If project is linked to any teamspace, then the permission is MEMBER
   * @param { string } projectId
   * @returns { EUserPermissions | undefined }
   */
  private getProjectRoleFromTeamspace = computedFn((projectId: string): EUserPermissions | undefined => {
    const projectTeamspaceIds = this.store.teamspaceRoot.teamspaces.getProjectTeamspaceIds(projectId);
    if (!projectTeamspaceIds || projectTeamspaceIds.length === 0) return undefined;
    return EUserPermissions.MEMBER;
  });

  /**
   * @description Returns the highest role from the project and teamspace membership
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { EUserPermissions | undefined }
   */
  getProjectRoleByWorkspaceSlugAndProjectId = computedFn(
    (workspaceSlug: string, projectId: string): EUserPermissions | undefined => {
      // Early return for invalid inputs
      if (!workspaceSlug || !projectId) return undefined;

      // Get permissions from the project and teamspace membership
      const projectRole = this.getProjectRole(workspaceSlug, projectId);
      const projectRoleFromTeamspace = this.getProjectRoleFromTeamspace(projectId);

      // Filter out undefined roles and get the highest role
      const roles = [projectRole, projectRoleFromTeamspace].filter(
        (role): role is EUserPermissions => role !== undefined
      );
      return getHighestRole(roles);
    }
  );
}

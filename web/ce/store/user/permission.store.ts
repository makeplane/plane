import { computedFn } from "mobx-utils";
import { EUserPermissions } from "@plane/constants";
import { RootStore } from "@/plane-web/store/root.store";
import { BaseUserPermissionStore, IBaseUserPermissionStore } from "@/store/user/base-permissions.store";

export type IUserPermissionStore = IBaseUserPermissionStore;

export class UserPermissionStore extends BaseUserPermissionStore implements IUserPermissionStore {
  constructor(store: RootStore) {
    super(store);
  }

  /**
   * @description Returns the project role from the workspace
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { EUserPermissions | undefined }
   */
  getProjectRoleByWorkspaceSlugAndProjectId = computedFn(
    (workspaceSlug: string, projectId: string): EUserPermissions | undefined =>
      this.getProjectRole(workspaceSlug, projectId)
  );
}

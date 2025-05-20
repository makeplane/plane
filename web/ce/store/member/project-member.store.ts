import { computedFn } from "mobx-utils";
// plane imports
import { EUserProjectRoles } from "@plane/constants";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
// store
import { IMemberRootStore } from "@/store/member";
import { BaseProjectMemberStore, IBaseProjectMemberStore } from "@/store/member/base-project-member.store";

export type IProjectMemberStore = IBaseProjectMemberStore;

export class ProjectMemberStore extends BaseProjectMemberStore implements IProjectMemberStore {
  constructor(_memberRoot: IMemberRootStore, rootStore: RootStore) {
    super(_memberRoot, rootStore);
  }

  /**
   * @description Returns the highest role from the project membership
   * @param { string } userId
   * @param { string } projectId
   * @returns { EUserProjectRoles | undefined }
   */
  getUserProjectRole = computedFn((userId: string, projectId: string): EUserProjectRoles | undefined =>
    this.getRoleFromProjectMembership(userId, projectId)
  );

  /**
   * @description Returns the role from the project membership
   * @param projectId
   * @param userId
   * @param role
   */
  getProjectMemberRoleForUpdate = (_projectId: string, _userId: string, role: EUserProjectRoles): EUserProjectRoles =>
    role;

  /**
   * @description Processes the removal of a member from a project
   * This method handles the cleanup of member data from the project member map
   * @param projectId - The ID of the project to remove the member from
   * @param userId - The ID of the user to remove from the project
   */
  processMemberRemoval = (projectId: string, userId: string) => this.handleMemberRemoval(projectId, userId);
}

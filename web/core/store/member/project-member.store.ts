import set from "lodash/set";
import sortBy from "lodash/sortBy";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import {
  IProjectBulkAddFormData,
  IProjectMember,
  IProjectMemberLite,
  IProjectMembership,
  IUserLite,
} from "@plane/types";
// plane-web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// services
import { ProjectMemberService } from "@/services/project";
// store
import { IRouterStore } from "@/store/router.store";
import { IUserStore } from "@/store/user";
// store
import { IProjectStore } from "../project/project.store";
import { CoreRootStore } from "../root.store";
import { IMemberRootStore } from ".";

export interface IProjectMemberDetails {
  id: string;
  member: IUserLite;
  role: EUserPermissions;
}

export interface IProjectMemberStore {
  // observables
  projectMemberMap: {
    [projectId: string]: Record<string, IProjectMembership>;
  };
  // computed
  projectMemberIds: string[] | null;
  // computed actions
  getProjectMemberDetails: (userId: string) => IProjectMemberDetails | null;
  getProjectMemberIds: (projectId: string) => string[] | null;
  // fetch actions
  fetchProjectMembers: (workspaceSlug: string, projectId: string) => Promise<IProjectMembership[]>;
  // bulk operation actions
  bulkAddMembersToProject: (
    workspaceSlug: string,
    projectId: string,
    data: IProjectBulkAddFormData
  ) => Promise<IProjectMembership[]>;
  // crud actions
  updateMember: (
    workspaceSlug: string,
    projectId: string,
    userId: string,
    data: { role: EUserPermissions }
  ) => Promise<IProjectMember>;
  removeMemberFromProject: (workspaceSlug: string, projectId: string, userId: string) => Promise<void>;
}

export class ProjectMemberStore implements IProjectMemberStore {
  // observables
  projectMemberMap: {
    [projectId: string]: Record<string, IProjectMembership>;
  } = {};
  // stores
  routerStore: IRouterStore;
  userStore: IUserStore;
  memberRoot: IMemberRootStore;
  projectRoot: IProjectStore;
  // services
  projectMemberService;

  constructor(_memberRoot: IMemberRootStore, _rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      projectMemberMap: observable,
      // computed
      projectMemberIds: computed,
      // actions
      fetchProjectMembers: action,
      bulkAddMembersToProject: action,
      updateMember: action,
      removeMemberFromProject: action,
    });

    // root store
    this.routerStore = _rootStore.router;
    this.userStore = _rootStore.user;
    this.memberRoot = _memberRoot;
    this.projectRoot = _rootStore.projectRoot.project;
    // services
    this.projectMemberService = new ProjectMemberService();
  }

  /**
   * @description get the list of all the user ids of all the members of the current project
   */
  get projectMemberIds() {
    const projectId = this.routerStore.projectId;
    if (!projectId) return null;
    let members = Object.values(this.projectMemberMap?.[projectId] ?? {});
    members = sortBy(members, [
      (m) => m.member !== this.userStore.data?.id,
      (m) => this.memberRoot.memberMap?.[m.member]?.display_name.toLowerCase(),
    ]);
    const memberIds = members.map((m) => m.member);
    return memberIds;
  }

  /**
   * @description get the details of a project member
   * @param userId
   */
  getProjectMemberDetails = computedFn((userId: string) => {
    const projectId = this.routerStore.projectId;
    if (!projectId) return null;
    const projectMember = this.projectMemberMap?.[projectId]?.[userId];
    if (!projectMember) return null;

    const memberDetails: IProjectMemberDetails = {
      id: projectMember.id,
      role: projectMember.role,
      member: this.memberRoot?.memberMap?.[projectMember.member],
    };
    return memberDetails;
  });

  /**
   * @description get the list of all the user ids of all the members of a project using projectId
   * @param projectId
   */
  getProjectMemberIds = computedFn((projectId: string): string[] | null => {
    if (!this.projectMemberMap?.[projectId]) return null;
    let members = Object.values(this.projectMemberMap?.[projectId]);
    members = sortBy(members, [
      (m) => m.member !== this.userStore.data?.id,
      (m) => this.memberRoot?.memberMap?.[m.member]?.display_name?.toLowerCase(),
    ]);
    const memberIds = members.map((m) => m.member);
    return memberIds;
  });

  /**
   * @description fetch the list of all the members of a project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectMembers = async (workspaceSlug: string, projectId: string) =>
    await this.projectMemberService.fetchProjectMembers(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((member) => {
          set(this.projectMemberMap, [projectId, member.member], member);
        });
      });
      return response;
    });

  /**
   * @description bulk add members to a project
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IProjectMembership[]>
   */
  bulkAddMembersToProject = async (workspaceSlug: string, projectId: string, data: IProjectBulkAddFormData) =>
    await this.projectMemberService.bulkAddMembersToProject(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        response.forEach((member) => {
          set(this.projectMemberMap, [projectId, member.member], member);
        });
      });
      this.projectRoot.projectMap[projectId].members = this.projectRoot.projectMap?.[projectId]?.members.concat(
        data.members as unknown as IProjectMemberLite[]
      );

      return response;
    });

  /**
   * @description update the role of a member in a project
   * @param workspaceSlug
   * @param projectId
   * @param userId
   * @param data
   */
  updateMember = async (workspaceSlug: string, projectId: string, userId: string, data: { role: EUserPermissions }) => {
    const memberDetails = this.getProjectMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    // original data to revert back in case of error
    const originalProjectMemberData = this.projectMemberMap?.[projectId]?.[userId];
    try {
      runInAction(() => {
        set(this.projectMemberMap, [projectId, userId, "role"], data.role);
      });
      const response = await this.projectMemberService.updateProjectMember(
        workspaceSlug,
        projectId,
        memberDetails?.id,
        data
      );
      return response;
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.projectMemberMap, [projectId, userId], originalProjectMemberData);
      });
      throw error;
    }
  };

  /**
   * @description remove a member from a project
   * @param workspaceSlug
   * @param projectId
   * @param userId
   */
  removeMemberFromProject = async (workspaceSlug: string, projectId: string, userId: string) => {
    const memberDetails = this.getProjectMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    await this.projectMemberService.deleteProjectMember(workspaceSlug, projectId, memberDetails?.id).then(() => {
      runInAction(() => {
        delete this.projectMemberMap?.[projectId]?.[userId];
      });
      this.projectRoot.projectMap[projectId].members = this.projectRoot.projectMap?.[projectId]?.members.filter(
        (member) => member.id !== userId
      );
    });
  };
}

import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IProjectMember } from "types";
// services
import { ProjectMemberService } from "services/project";

export interface IProjectMemberStore {
  // states
  error: any | null;

  // observables
  members: {
    [projectId: string]: IProjectMember[] | null; // project_id: members
  };
  // computed
  projectMembers: IProjectMember[] | null;
  // actions
  getProjectMemberById: (memberId: string) => IProjectMember | null;
  getProjectMemberByUserId: (memberId: string) => IProjectMember | null;
  fetchProjectMembers: (workspaceSlug: string, projectId: string) => Promise<void>;
  removeMemberFromProject: (workspaceSlug: string, projectId: string, memberId: string) => Promise<void>;
  updateMember: (
    workspaceSlug: string,
    projectId: string,
    memberId: string,
    data: Partial<IProjectMember>
  ) => Promise<IProjectMember>;

  deleteProjectInvitation: (workspaceSlug: string, projectId: string, memberId: string) => Promise<void>;
}

export class ProjectMemberStore implements IProjectMemberStore {
  // states
  error: any | null = null;

  // observables
  members: {
    [projectId: string]: IProjectMember[]; // projectId: members
  } = {};

  // root store
  rootStore;
  // service
  projectMemberService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      members: observable.ref,
      // computed
      projectMembers: computed,
      // action
      getProjectMemberById: action,
      fetchProjectMembers: action,
      removeMemberFromProject: action,
      updateMember: action,
    });

    this.rootStore = _rootStore;
    this.projectMemberService = new ProjectMemberService();
  }

  /**
   * Computed value of current members in the project
   */
  get projectMembers() {
    if (!this.rootStore.project.projectId) return null;
    return this.members[this.rootStore.project.projectId] || null;
  }

  /**
   * Get all project information using membership id
   * @param memberId
   * @returns
   */
  getProjectMemberById = (memberId: string) => {
    if (!this.rootStore.project.projectId) return null;
    const members = this.projectMembers;
    if (!members) return null;
    const memberInfo: IProjectMember | null = members.find((member) => member.id === memberId) || null;
    return memberInfo;
  };

  /**
   * Get user information from the project members using user id
   * @param memberId
   * @returns
   */
  getProjectMemberByUserId = (memberId: string) => {
    if (!this.rootStore.project.projectId) return null;
    const members = this.projectMembers;
    if (!members) return null;
    const memberInfo: IProjectMember | null = members.find((member) => member.member.id === memberId) || null;
    return memberInfo;
  };

  /**
   * fetch the project members info using workspace id and project id
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectMembers = async (workspaceSlug: string, projectId: string) => {
    try {
      const membersResponse = await this.projectMemberService.fetchProjectMembers(workspaceSlug, projectId);
      const _members = {
        ...this.members,
        [projectId]: membersResponse,
      };
      runInAction(() => {
        this.members = _members;
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  /**
   * Remove user from the project
   * @param workspaceSlug
   * @param projectId
   * @param memberId
   */
  removeMemberFromProject = async (workspaceSlug: string, projectId: string, memberId: string) => {
    const originalMembers = this.projectMembers || [];

    try {
      runInAction(() => {
        this.members = {
          ...this.members,
          [projectId]: this.projectMembers?.filter((member) => member.id !== memberId) || [],
        };
      });

      await this.projectMemberService.deleteProjectMember(workspaceSlug, projectId, memberId);
      await this.fetchProjectMembers(workspaceSlug, projectId);
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        this.error = error;
        this.members = {
          ...this.members,
          [projectId]: originalMembers,
        };
      });

      throw error;
    }
  };

  /**
   * Update member information
   * @param workspaceSlug
   * @param projectId
   * @param memberId
   * @param data
   * @returns
   */
  updateMember = async (workspaceSlug: string, projectId: string, memberId: string, data: Partial<IProjectMember>) => {
    const originalMembers = this.projectMembers || [];
    try {
      runInAction(() => {
        this.members = {
          ...this.members,
          [projectId]: (this.projectMembers || [])?.map((member) =>
            member.id === memberId ? { ...member, ...data } : member
          ),
        };
      });
      const response = await this.projectMemberService.updateProjectMember(workspaceSlug, projectId, memberId, data);
      await this.fetchProjectMembers(workspaceSlug, projectId);
      return response;
    } catch (error) {
      console.log("Failed to update project member from project store");
      // revert back to original members in case of error
      runInAction(() => {
        this.members = {
          ...this.members,
          [projectId]: originalMembers,
        };
      });
      throw error;
    }
  };

  deleteProjectInvitation = async () => {
    try {
    } catch (error) {
      throw error;
    }
  };
}

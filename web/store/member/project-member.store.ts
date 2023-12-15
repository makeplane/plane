import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { set } from "lodash";
// services
import { ProjectMemberService } from "services/project";
// types
import { RootStore } from "store/root.store";
import { IProjectMember, IUserLite } from "types";
// constants
import { EUserProjectRoles } from "constants/project";

interface IProjectMemberDetails {
  id: string;
  member: IUserLite;
  role: EUserProjectRoles;
}

export interface IProjectMemberStore {
  // observables
  projectMemberMap: {
    [projectId: string]: Record<string, IProjectMember>;
  };
  // computed
  projectMembers: string[] | null;
  // computed actions
  getProjectMemberDetails: (projectMemberId: string) => IProjectMemberDetails | null;
  // actions
  fetchProjectMembers: (workspaceSlug: string, projectId: string) => Promise<IProjectMember[]>;
}

export class ProjectMemberStore implements IProjectMemberStore {
  // observables
  projectMemberMap: {
    [projectId: string]: Record<string, IProjectMember>;
  } = {};
  // root store
  rootStore: RootStore;
  // root store memberMap
  memberMap: Record<string, IUserLite> = {};
  // services
  projectMemberService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      projectMemberMap: observable,
      // computed
      projectMembers: computed,
      // computed actions
      getProjectMemberDetails: action,
      // actions
      fetchProjectMembers: action,
    });

    // root store
    this.rootStore = _rootStore;
    this.memberMap = this.rootStore.memberRoot.memberMap;
    // services
    this.projectMemberService = new ProjectMemberService();
  }

  get projectMembers() {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return null;

    return Object.keys(this.projectMemberMap?.[projectId] ?? {});
  }

  getProjectMemberDetails = (projectMemberId: string) => {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return null;

    const projectMember = this.projectMemberMap?.[projectId]?.[projectMemberId];

    const memberDetails: IProjectMemberDetails = {
      id: projectMember.id,
      role: projectMember.role,
      member: this.memberMap?.[projectMember.member],
    };

    return memberDetails;
  };

  fetchProjectMembers = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectMemberService.fetchProjectMembers(workspaceSlug, projectId);

      runInAction(() => {
        response.forEach((member) => {
          set(this.projectMemberMap, [projectId, member.member], member);
        });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}

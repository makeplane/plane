import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { set } from "lodash";
// services
import { WorkspaceService } from "services/workspace.service";
// types
import { RootStore } from "store/root.store";
import { IUserLite, IWorkspaceMember } from "types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

interface IWorkspaceMembership {
  id: string;
  member: string;
  role: EUserWorkspaceRoles;
}

export interface IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: {
    [workspaceSlug: string]: Record<string, IWorkspaceMembership>;
  };
  // computed
  workspaceMembers: string[] | null;
  // computed actions
  getWorkspaceMemberDetails: (workspaceMemberId: string) => IWorkspaceMember | null;
  // actions
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<IWorkspaceMember[]>;
}

export class WorkspaceMemberStore implements IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: {
    [workspaceSlug: string]: Record<string, IWorkspaceMembership>;
  } = {};
  // root store
  rootStore: RootStore;
  // root store memberMap
  memberMap: Record<string, IUserLite> = {};
  // services
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      workspaceMemberMap: observable,
      // computed
      workspaceMembers: computed,
      // computed actions
      getWorkspaceMemberDetails: action,
      // actions
      fetchWorkspaceMembers: action,
    });

    // root store
    this.rootStore = _rootStore;
    this.memberMap = this.rootStore.memberRoot.memberMap;
    // services
    this.workspaceService = new WorkspaceService();
  }

  get workspaceMembers() {
    const workspaceSlug = this.rootStore.app.router.workspaceSlug;

    if (!workspaceSlug) return null;

    return Object.keys(this.workspaceMemberMap?.[workspaceSlug] ?? {});
  }

  getWorkspaceMemberDetails = (workspaceMemberId: string) => {
    const workspaceSlug = this.rootStore.app.router.workspaceSlug;

    if (!workspaceSlug) return null;

    const workspaceMember = this.workspaceMemberMap?.[workspaceSlug]?.[workspaceMemberId];

    const memberDetails: IWorkspaceMember = {
      id: workspaceMember.id,
      role: workspaceMember.role,
      member: this.memberMap?.[workspaceMember.member],
    };

    return memberDetails;
  };

  fetchWorkspaceMembers = async (workspaceSlug: string) => {
    try {
      const response = await this.workspaceService.fetchWorkspaceMembers(workspaceSlug);

      runInAction(() => {
        response.forEach((member) => {
          set(this.memberMap, member.member.id, member.member);
          set(this.workspaceMemberMap, [workspaceSlug, member.member.id], {
            id: member.id,
            member: member.member.id,
            role: member.role,
          });
        });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}

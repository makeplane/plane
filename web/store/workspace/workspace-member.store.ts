import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { RootStore } from "../root";
// types
import { IWorkspaceMember, IWorkspaceMemberInvitation, IWorkspaceBulkInviteFormData, IUserProjectsRole } from "types";
// services
import { WorkspaceService } from "services/workspace.service";

export interface IWorkspaceMemberStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  members: { [workspaceSlug: string]: IWorkspaceMember[] }; // workspaceSlug: members[]
  memberInvitations: { [workspaceSlug: string]: IWorkspaceMemberInvitation[] };
  workspaceUserProjectsRole: { [workspaceSlug: string]: IUserProjectsRole } | undefined;
  // actions
  fetchWorkspaceUserProjectsRole: (workspaceSlug: string) => Promise<IUserProjectsRole>;
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<void>;
  fetchWorkspaceMemberInvitations: (workspaceSlug: string) => Promise<IWorkspaceMemberInvitation[]>;
  updateMember: (workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>) => Promise<void>;
  removeMember: (workspaceSlug: string, memberId: string) => Promise<void>;
  inviteMembersToWorkspace: (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => Promise<any>;
  updateMemberInvitation: (
    workspaceSlug: string,
    memberId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => Promise<void>;
  deleteWorkspaceInvitation: (workspaceSlug: string, memberId: string) => Promise<void>;
  // computed
  workspaceMembers: IWorkspaceMember[] | null;
  workspaceMemberInvitations: IWorkspaceMemberInvitation[] | null;
  workspaceMembersWithInvitations: any[] | null;
  currentWorkspaceUserProjectsRole: IUserProjectsRole | undefined;
}

export class WorkspaceMemberStore implements IWorkspaceMemberStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  members: { [workspaceSlug: string]: IWorkspaceMember[] } = {};
  memberInvitations: { [workspaceSlug: string]: IWorkspaceMemberInvitation[] } = {};
  workspaceUserProjectsRole: { [workspaceSlug: string]: IUserProjectsRole } | undefined = undefined;
  // services
  workspaceService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      members: observable.ref,
      memberInvitations: observable.ref,
      workspaceUserProjectsRole: observable.ref,
      // actions
      fetchWorkspaceUserProjectsRole: action,
      fetchWorkspaceMembers: action,
      fetchWorkspaceMemberInvitations: action,
      updateMember: action,
      removeMember: action,
      inviteMembersToWorkspace: action,
      updateMemberInvitation: action,
      deleteWorkspaceInvitation: action,
      // computed
      workspaceMembers: computed,
      workspaceMemberInvitations: computed,
      workspaceMembersWithInvitations: computed,
      currentWorkspaceUserProjectsRole: computed,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
  }

  /**
   * computed value of workspace members using the workspace slug from the store
   */
  get workspaceMembers() {
    if (!this.rootStore.workspace.workspaceSlug) return null;
    const members = this.members?.[this.rootStore.workspace.workspaceSlug];
    if (!members) return null;
    return members;
  }

  /**
   * Computed value of workspace member invitations using workspace slug from store
   */
  get workspaceMemberInvitations() {
    if (!this.rootStore.workspace.workspaceSlug) return null;
    const invitations = this.memberInvitations?.[this.rootStore.workspace.workspaceSlug];
    if (!invitations) return null;
    return invitations;
  }

  /**
   * computed value provides the members information including the invitations.
   */
  get workspaceMembersWithInvitations() {
    if (!this.workspaceMembers) return null;

    return [
      ...(this.workspaceMemberInvitations?.map((item) => ({
        id: item.id,
        memberId: item.id,
        avatar: "",
        first_name: item.email,
        last_name: "",
        email: item.email,
        display_name: item.email,
        role: item.role,
        status: item.accepted,
        member: false,
        accountCreated: item.accepted,
      })) || []),
      ...(this.workspaceMembers?.map((item) => ({
        id: item.id,
        memberId: item.member?.id,
        avatar: item.member?.avatar,
        first_name: item.member?.first_name,
        last_name: item.member?.last_name,
        email: item.member?.email,
        display_name: item.member?.display_name,
        role: item.role,
        status: true,
        member: true,
        accountCreated: true,
      })) || []),
    ];
  }

  /**
   * computed value provides the workspace user projects role
   */
  get currentWorkspaceUserProjectsRole() {
    if (!this.rootStore.workspace.workspaceSlug) return undefined;

    return this.workspaceUserProjectsRole?.[this.rootStore.workspace.workspaceSlug];
  }

  /**
   * fetch workspace user projects role using workspace slug
   * @param workspaceSlug
   */
  fetchWorkspaceUserProjectsRole = async (workspaceSlug: string) => {
    try {
      const _workspaceUserProjectsRole = { ...this.workspaceUserProjectsRole };
      if (!_workspaceUserProjectsRole[workspaceSlug]) _workspaceUserProjectsRole[workspaceSlug] = {};

      const response = await this.workspaceService.getWorkspaceUserProjectsRole(workspaceSlug);
      _workspaceUserProjectsRole[workspaceSlug] = response;

      runInAction(() => {
        this.workspaceUserProjectsRole = _workspaceUserProjectsRole;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * fetch workspace members using workspace slug
   * @param workspaceSlug
   */
  fetchWorkspaceMembers = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const membersResponse = await this.workspaceService.fetchWorkspaceMembers(workspaceSlug);

      runInAction(() => {
        this.members = {
          ...this.members,
          [workspaceSlug]: membersResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  /**
   * fetching workspace member invitations
   * @param workspaceSlug
   * @returns
   */
  fetchWorkspaceMemberInvitations = async (workspaceSlug: string) => {
    try {
      const membersInvitations = await this.workspaceService.workspaceInvitations(workspaceSlug);
      runInAction(() => {
        this.memberInvitations = {
          ...this.memberInvitations,
          [workspaceSlug]: membersInvitations,
        };
      });
      return membersInvitations;
    } catch (error) {
      throw error;
    }
  };

  /**
   * invite members to the workspace using emails
   * @param workspaceSlug
   * @param data
   */
  inviteMembersToWorkspace = async (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => {
    try {
      await this.workspaceService.inviteWorkspace(workspaceSlug, data);
      await this.fetchWorkspaceMemberInvitations(workspaceSlug);
    } catch (error) {
      throw error;
    }
  };

  /**
   * update workspace member invitation using workspace slug and member id and data
   * @param workspaceSlug
   * @param memberId
   * @param data
   */
  updateMemberInvitation = async (
    workspaceSlug: string,
    memberId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => {
    const originalMemberInvitations = [...this.memberInvitations?.[workspaceSlug]]; // in case of error, we will revert back to original members

    const memberInvitations = [...this.memberInvitations?.[workspaceSlug]];

    const index = memberInvitations.findIndex((m) => m.id === memberId);
    memberInvitations[index] = { ...memberInvitations[index], ...data };

    // optimistic update
    runInAction(() => {
      this.loader = true;
      this.error = null;
      this.memberInvitations = {
        ...this.memberInvitations,
        [workspaceSlug]: memberInvitations,
      };
    });

    try {
      await this.workspaceService.updateWorkspaceInvitation(workspaceSlug, memberId, data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.memberInvitations = {
          ...this.memberInvitations,
          [workspaceSlug]: originalMemberInvitations,
        };
      });

      throw error;
    }
  };

  /**
   * delete the workspace invitation
   * @param workspaceSlug
   * @param memberId
   */
  deleteWorkspaceInvitation = async (workspaceSlug: string, memberId: string) => {
    try {
      runInAction(() => {
        this.memberInvitations = {
          ...this.memberInvitations,
          [workspaceSlug]: [...this.memberInvitations[workspaceSlug].filter((inv) => inv.id !== memberId)],
        };
      });
      await this.workspaceService.deleteWorkspaceInvitations(workspaceSlug.toString(), memberId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * update workspace member using workspace slug and member id and data
   * @param workspaceSlug
   * @param memberId
   * @param data
   */
  updateMember = async (workspaceSlug: string, memberId: string, data: Partial<IWorkspaceMember>) => {
    const originalMembers = [...this.members?.[workspaceSlug]]; // in case of error, we will revert back to original members

    const members = [...this.members?.[workspaceSlug]];

    const index = members.findIndex((m) => m.id === memberId);
    members[index] = { ...members[index], ...data };

    // optimistic update
    runInAction(() => {
      this.loader = true;
      this.error = null;
      this.members = {
        ...this.members,
        [workspaceSlug]: members,
      };
    });

    try {
      await this.workspaceService.updateWorkspaceMember(workspaceSlug, memberId, data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.members = {
          ...this.members,
          [workspaceSlug]: originalMembers,
        };
      });

      throw error;
    }
  };

  /**
   * remove workspace member using workspace slug and member id
   * @param workspaceSlug
   * @param memberId
   */
  removeMember = async (workspaceSlug: string, memberId: string) => {
    const members = [...this.members?.[workspaceSlug]];
    const originalMembers = this.members?.[workspaceSlug]; // in case of error, we will revert back to original members

    // removing member from the array
    const index = members.findIndex((m) => m.id === memberId);
    members.splice(index, 1);

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.members = {
          ...this.members,
          [workspaceSlug]: members,
        };
      });

      await this.workspaceService.deleteWorkspaceMember(workspaceSlug, memberId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.members = {
          ...this.members,
          [workspaceSlug]: originalMembers,
        };
      });

      throw error;
    }
  };
}

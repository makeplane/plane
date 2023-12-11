// mobx
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// services
import { ProjectMemberService, ProjectService } from "services/project";
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
import { AuthService } from "services/auth.service";
// interfaces
import { IUser, IUserSettings } from "types/users";
import { IWorkspaceMemberMe, IProjectMember, TUserProjectRole, TUserWorkspaceRole } from "types";
import { RootStore } from "../root.store";

export interface IUserMembershipStore {
  workspaceMemberInfo: {
    [workspaceSlug: string]: IWorkspaceMemberMe;
  };
  hasPermissionToWorkspace: {
    [workspaceSlug: string]: boolean | null;
  };
  projectMemberInfo: {
    [projectId: string]: IProjectMember;
  };
  hasPermissionToProject: {
    [projectId: string]: boolean | null;
  };

  currentProjectMemberInfo: IProjectMember | undefined;
  currentWorkspaceMemberInfo: IWorkspaceMemberMe | undefined;
  currentProjectRole: TUserProjectRole | undefined;
  currentWorkspaceRole: TUserWorkspaceRole | undefined;

  hasPermissionToCurrentWorkspace: boolean | undefined;
  hasPermissionToCurrentProject: boolean | undefined;

  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;

  leaveWorkspace: (workspaceSlug: string) => Promise<void>;
  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<any>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class UserMembershipStore implements IUserMembershipStore {
  workspaceMemberInfo: {
    [workspaceSlug: string]: IWorkspaceMemberMe;
  } = {};
  hasPermissionToWorkspace: {
    [workspaceSlug: string]: boolean;
  } = {};
  projectMemberInfo: {
    [projectId: string]: IProjectMember;
  } = {};
  hasPermissionToProject: {
    [projectId: string]: boolean;
  } = {};
  // root store
  rootStore;
  // services
  userService;
  workspaceService;
  projectService;
  projectMemberService;
  authService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      workspaceMemberInfo: observable.ref,
      hasPermissionToWorkspace: observable.ref,
      projectMemberInfo: observable.ref,
      hasPermissionToProject: observable.ref,
      // action
      fetchUserWorkspaceInfo: action,
      fetchUserProjectInfo: action,
      leaveWorkspace: action,
      joinProject: action,
      leaveProject: action,
      // computed
      currentProjectMemberInfo: computed,
      currentWorkspaceMemberInfo: computed,
      currentProjectRole: computed,
      currentWorkspaceRole: computed,
      hasPermissionToCurrentWorkspace: computed,
      hasPermissionToCurrentProject: computed,
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectService();
    this.projectMemberService = new ProjectMemberService();
    this.authService = new AuthService();
  }

  get currentWorkspaceMemberInfo() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.workspaceMemberInfo[this.rootStore.workspace.workspaceSlug];
  }

  get currentWorkspaceRole() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.workspaceMemberInfo[this.rootStore.workspace.workspaceSlug]?.role;
  }

  get currentProjectMemberInfo() {
    if (!this.rootStore.project.projectId) return;
    return this.projectMemberInfo[this.rootStore.project.projectId];
  }

  get currentProjectRole() {
    if (!this.rootStore.project.projectId) return;
    return this.projectMemberInfo[this.rootStore.project.projectId]?.role;
  }

  get hasPermissionToCurrentWorkspace() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.hasPermissionToWorkspace[this.rootStore.workspace.workspaceSlug];
  }

  get hasPermissionToCurrentProject() {
    if (!this.rootStore.project.projectId) return;
    return this.hasPermissionToProject[this.rootStore.project.projectId];
  }

  fetchUserWorkspaceInfo = async (workspaceSlug: string) => {
    try {
      const response = await this.workspaceService.workspaceMemberMe(workspaceSlug);

      runInAction(() => {
        this.workspaceMemberInfo = {
          ...this.workspaceMemberInfo,
          [workspaceSlug]: response,
        };
        this.hasPermissionToWorkspace = {
          ...this.hasPermissionToWorkspace,
          [workspaceSlug]: true,
        };
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.hasPermissionToWorkspace = {
          ...this.hasPermissionToWorkspace,
          [workspaceSlug]: false,
        };
      });
      throw error;
    }
  };

  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

      runInAction(() => {
        this.projectMemberInfo = {
          ...this.projectMemberInfo,
          [projectId]: response,
        };
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          [projectId]: true,
        };
      });
      return response;
    } catch (error: any) {
      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          [projectId]: false,
        };
      });

      throw error;
    }
  };

  leaveWorkspace = async (workspaceSlug: string) => {
    try {
      await this.userService.leaveWorkspace(workspaceSlug);

      runInAction(() => {
        delete this.workspaceMemberInfo[workspaceSlug];
        delete this.hasPermissionToWorkspace[workspaceSlug];
      });
    } catch (error) {
      throw error;
    }
  };

  joinProject = async (workspaceSlug: string, projectIds: string[]) => {
    const newPermissions: { [projectId: string]: boolean } = {};
    projectIds.forEach((projectId) => {
      newPermissions[projectId] = true;
    });

    try {
      const response = await this.userService.joinProject(workspaceSlug, projectIds);

      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  leaveProject = async (workspaceSlug: string, projectId: string) => {
    const newPermissions: { [projectId: string]: boolean } = {};
    newPermissions[projectId] = false;

    try {
      await this.userService.leaveProject(workspaceSlug, projectId);

      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });
    } catch (error) {
      throw error;
    }
  };
}

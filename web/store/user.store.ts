// mobx
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// services
import { ProjectService } from "services/project";
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
// interfaces
import { IUser, IUserSettings } from "types/users";
import { IWorkspaceMemberMe, IProjectMember } from "types";
import { RootStore } from "./root";

export interface IUserStore {
  loader: boolean;

  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  currentUserSettings: IUserSettings | null;

  dashboardInfo: any;

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
  currentProjectRole: number | undefined;
  currentWorkspaceRole: number | undefined;

  hasPermissionToCurrentWorkspace: boolean | undefined;
  hasPermissionToCurrentProject: boolean | undefined;

  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;

  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;
  fetchUserDashboardInfo: (workspaceSlug: string, month: number) => Promise<any>;

  updateTourCompleted: () => Promise<void>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
  updateCurrentUserTheme: (theme: string) => Promise<IUser>;
}

class UserStore implements IUserStore {
  loader: boolean = false;

  isUserLoggedIn: boolean | null = null;
  currentUser: IUser | null = null;
  currentUserSettings: IUserSettings | null = null;

  dashboardInfo: any = null;

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

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      currentUser: observable.ref,
      currentUserSettings: observable.ref,
      dashboardInfo: observable.ref,
      workspaceMemberInfo: observable.ref,
      hasPermissionToWorkspace: observable.ref,
      projectMemberInfo: observable.ref,
      hasPermissionToProject: observable.ref,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserSettings: action,
      fetchUserDashboardInfo: action,
      fetchUserWorkspaceInfo: action,
      fetchUserProjectInfo: action,
      updateTourCompleted: action,
      updateCurrentUser: action,
      updateCurrentUserTheme: action,
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
  }

  get currentWorkspaceMemberInfo() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.workspaceMemberInfo[this.rootStore.workspace.workspaceSlug];
  }

  get currentWorkspaceRole() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.workspaceMemberInfo[this.rootStore.workspace.workspaceSlug].role;
  }

  get currentProjectMemberInfo() {
    if (!this.rootStore.project.projectId) return;
    return this.projectMemberInfo[this.rootStore.project.projectId];
  }

  get currentProjectRole() {
    if (!this.rootStore.project.projectId) return;
    return this.projectMemberInfo[this.rootStore.project.projectId].role;
  }

  get hasPermissionToCurrentWorkspace() {
    if (!this.rootStore.workspace.workspaceSlug) return;
    return this.hasPermissionToWorkspace[this.rootStore.workspace.workspaceSlug];
  }

  get hasPermissionToCurrentProject() {
    if (!this.rootStore.project.projectId) return;
    return this.hasPermissionToProject[this.rootStore.project.projectId];
  }

  fetchCurrentUser = async () => {
    try {
      const response = await this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUser = response;
          this.isUserLoggedIn = true;
        });
      }
      return response;
    } catch (error) {
      runInAction(() => {
        this.isUserLoggedIn = false;
      });
      throw error;
    }
  };

  fetchCurrentUserSettings = async () => {
    try {
      const response = await this.userService.currentUserSettings();
      if (response) {
        runInAction(() => {
          this.currentUserSettings = response;
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchUserDashboardInfo = async (workspaceSlug: string, month: number) => {
    try {
      const response = await this.userService.userWorkspaceDashboard(workspaceSlug, month);
      runInAction(() => {
        this.dashboardInfo = response;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

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
      const response = await this.projectService.projectMemberMe(workspaceSlug, projectId);

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

  updateTourCompleted = async () => {
    try {
      if (this.currentUser) {
        runInAction(() => {
          this.currentUser = {
            ...this.currentUser,
            is_tour_completed: true,
          } as IUser;
        });
        const response = await this.userService.updateUserTourCompleted(this.currentUser);
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  updateCurrentUser = async (data: Partial<IUser>) => {
    try {
      const response = await this.userService.updateUser(data);
      runInAction(() => {
        this.currentUser = response;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateCurrentUserTheme = async (theme: string) => {
    try {
      runInAction(() => {
        this.currentUser = {
          ...this.currentUser,
          theme: {
            ...this.currentUser?.theme,
            theme,
          },
        } as IUser;
      });
      const response = await this.userService.updateUser({
        theme: { ...this.currentUser?.theme, theme },
      } as IUser);
      return response;
    } catch (error) {
      throw error;
    }
  };
}

export default UserStore;

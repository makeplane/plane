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
import { RootStore } from "./root";

export interface IUserStore {
  loader: boolean;
  currentUserError: any;

  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  isUserInstanceAdmin: boolean | null;
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
  currentProjectRole: TUserProjectRole | undefined;
  currentWorkspaceRole: TUserWorkspaceRole | undefined;

  hasPermissionToCurrentWorkspace: boolean | undefined;
  hasPermissionToCurrentProject: boolean | undefined;

  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserInstanceAdminStatus: () => Promise<boolean>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;

  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;
  fetchUserDashboardInfo: (workspaceSlug: string, month: number) => Promise<any>;

  updateUserOnBoard: () => Promise<void>;
  updateTourCompleted: () => Promise<void>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
  updateCurrentUserTheme: (theme: string) => Promise<IUser>;

  deactivateAccount: () => Promise<void>;
  signOut: () => Promise<void>;

  leaveWorkspace: (workspaceSlug: string) => Promise<void>;

  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<any>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

class UserStore implements IUserStore {
  loader: boolean = false;
  currentUserError: any = null;

  isUserLoggedIn: boolean | null = null;
  currentUser: IUser | null = null;
  isUserInstanceAdmin: boolean | null = null;
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
  projectMemberService;
  authService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      isUserLoggedIn: observable.ref,
      currentUser: observable.ref,
      isUserInstanceAdmin: observable.ref,
      currentUserSettings: observable.ref,
      dashboardInfo: observable.ref,
      workspaceMemberInfo: observable.ref,
      hasPermissionToWorkspace: observable.ref,
      projectMemberInfo: observable.ref,
      hasPermissionToProject: observable.ref,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserInstanceAdminStatus: action,
      fetchCurrentUserSettings: action,
      fetchUserDashboardInfo: action,
      fetchUserWorkspaceInfo: action,
      fetchUserProjectInfo: action,
      updateUserOnBoard: action,
      updateTourCompleted: action,
      updateCurrentUser: action,
      updateCurrentUserTheme: action,
      deactivateAccount: action,
      leaveWorkspace: action,
      joinProject: action,
      leaveProject: action,
      signOut: action,
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

  fetchCurrentUser = async () => {
    try {
      const response = await this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUserError = null;
          this.currentUser = response;
          this.isUserLoggedIn = true;
        });
      }
      return response;
    } catch (error) {
      runInAction(() => {
        this.currentUserError = error;
        this.isUserLoggedIn = false;
      });
      throw error;
    }
  };

  fetchCurrentUserInstanceAdminStatus = async () => {
    try {
      const response = await this.userService.currentUserInstanceAdminStatus();
      if (response) {
        runInAction(() => {
          this.isUserInstanceAdmin = response.is_instance_admin;
        });
      }
      return response.is_instance_admin;
    } catch (error) {
      runInAction(() => {
        this.isUserInstanceAdmin = false;
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

  updateUserOnBoard = async () => {
    try {
      runInAction(() => {
        this.currentUser = {
          ...this.currentUser,
          is_onboarded: true,
        } as IUser;
      });

      const user = this.currentUser ?? undefined;

      if (!user) return;

      await this.userService.updateUserOnBoard();
    } catch (error) {
      this.fetchCurrentUser();

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

        const response = await this.userService.updateUserTourCompleted();

        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  updateCurrentUser = async (data: Partial<IUser>) => {
    try {
      runInAction(() => {
        this.currentUser = {
          ...this.currentUser,
          ...data,
        } as IUser;
      });

      const response = await this.userService.updateUser(data);

      runInAction(() => {
        this.currentUser = response;
      });
      return response;
    } catch (error) {
      this.fetchCurrentUser();

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

  deactivateAccount = async () => {
    try {
      await this.userService.deactivateAccount();
    } catch (error) {
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

  signOut = async () => {
    try {
      await this.authService.signOut();
      runInAction(() => {
        this.currentUserError = null;
        this.currentUser = null;
        this.isUserLoggedIn = false;
      });
    } catch (error) {
      throw error;
    }
  };
}

export default UserStore;

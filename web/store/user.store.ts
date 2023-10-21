// mobx
import { action, observable, runInAction, makeObservable } from "mobx";
// services
import { ProjectService } from "services/project";
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
// interfaces
import { IUser, IUserSettings } from "types/users";
import { IWorkspaceMember, IProjectMember } from "types";

interface IUserStore {
  loader: boolean;

  currentUser: IUser | null;
  currentUserSettings: IUserSettings | null;

  dashboardInfo: any;

  workspaceMemberInfo: any;
  hasPermissionToWorkspace: boolean | null;

  projectMemberInfo: any;
  projectNotFound: boolean;
  hasPermissionToProject: boolean | null;

  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;

  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMember>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;

  updateTourCompleted: () => Promise<void>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
}

class UserStore implements IUserStore {
  loader: boolean = false;

  currentUser: IUser | null = null;
  currentUserSettings: IUserSettings | null = null;

  dashboardInfo: any = null;

  workspaceMemberInfo: any = null;
  hasPermissionToWorkspace: boolean | null = null;

  projectMemberInfo: any = null;
  projectNotFound: boolean = false;
  hasPermissionToProject: boolean | null = null;
  // root store
  rootStore;
  // services
  userService;
  workspaceService;
  projectService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      currentUser: observable.ref,
      currentUserSettings: observable.ref,
      dashboardInfo: observable.ref,
      workspaceMemberInfo: observable.ref,
      hasPermissionToWorkspace: observable.ref,
      projectMemberInfo: observable.ref,
      projectNotFound: observable.ref,
      hasPermissionToProject: observable.ref,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserSettings: action,
      // computed
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectService();
  }

  fetchCurrentUser = async () => {
    try {
      const response = await this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUser = response;
        });
      }
      return response;
    } catch (error) {
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
      const response = await this.workspaceService.workspaceMemberMe(workspaceSlug.toString());
      runInAction(() => {
        this.workspaceMemberInfo = response;
        this.hasPermissionToWorkspace = true;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.hasPermissionToWorkspace = false;
      });
      throw error;
    }
  };

  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.projectMemberMe(workspaceSlug, projectId);

      console.log("response", response);
      runInAction(() => {
        this.projectMemberInfo = response;
        this.hasPermissionToWorkspace = true;
      });
      return response;
    } catch (error: any) {
      runInAction(() => {
        this.hasPermissionToWorkspace = false;
      });
      if (error?.status === 404) {
        runInAction(() => {
          this.projectNotFound = true;
        });
      }
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

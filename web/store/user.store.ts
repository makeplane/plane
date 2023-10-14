// mobx
import { action, observable, runInAction, makeObservable } from "mobx";
// services
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
// interfaces
import { IUser, IUserSettings } from "types/users";

interface IUserStore {
  loader: boolean;
  currentUser: IUser | null;
  currentUserSettings: IUserSettings | null;
  dashboardInfo: any;
  memberInfo: any;
  hasPermissionToWorkspace: boolean | null;
  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;
  updateTourCompleted: () => Promise<void>;
}

class UserStore implements IUserStore {
  loader: boolean = false;
  currentUser: IUser | null = null;
  currentUserSettings: IUserSettings | null = null;
  dashboardInfo: any = null;
  memberInfo: any = null;
  hasPermissionToWorkspace: boolean | null = null;
  // root store
  rootStore;
  // services
  userService;
  workspaceService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      currentUser: observable.ref,
      currentUserSettings: observable.ref,
      dashboardInfo: observable.ref,
      memberInfo: observable.ref,
      hasPermissionToWorkspace: observable.ref,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserSettings: action,
      // computed
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.workspaceService = new WorkspaceService();
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
        this.memberInfo = response;
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

  // setCurrentUser = async () => {
  //   try {
  //     let userResponse: ICurrentUser | null = await UserService.currentUser();
  //     userResponse = userResponse || null;

  //     if (userResponse) {
  //       const userPayload: ICurrentUser = {
  //         id: userResponse?.id,
  //         avatar: userResponse?.avatar,
  //         first_name: userResponse?.first_name,
  //         last_name: userResponse?.last_name,
  //         username: userResponse?.username,
  //         email: userResponse?.email,
  //         mobile_number: userResponse?.mobile_number,
  //         is_email_verified: userResponse?.is_email_verified,
  //         is_tour_completed: userResponse?.is_tour_completed,
  //         onboarding_step: userResponse?.onboarding_step,
  //         is_onboarded: userResponse?.is_onboarded,
  //         role: userResponse?.role,
  //       };
  //       runInAction(() => {
  //         this.currentUser = userPayload;
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Fetching current user error", error);
  //   }
  // };

  // setCurrentUserSettings = async () => {
  //   try {
  //     let userSettingsResponse: ICurrentUserSettings | null = await UserService.currentUser();
  //     userSettingsResponse = userSettingsResponse || null;

  //     if (userSettingsResponse) {
  //       const themePayload = {
  //         theme: { ...userSettingsResponse?.theme },
  //       };
  //       runInAction(() => {
  //         this.currentUserSettings = themePayload;
  //         this.rootStore.theme.setTheme(themePayload);
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Fetching current user error", error);
  //   }
  // };

  // updateCurrentUser = async (user: ICurrentUser) => {
  //   try {
  //     let userResponse: ICurrentUser = await UserService.updateUser(user);
  //     userResponse = userResponse || null;

  //     if (userResponse) {
  //       const userPayload: ICurrentUser = {
  //         id: userResponse?.id,
  //         avatar: userResponse?.avatar,
  //         first_name: userResponse?.first_name,
  //         last_name: userResponse?.last_name,
  //         username: userResponse?.username,
  //         email: userResponse?.email,
  //         mobile_number: userResponse?.mobile_number,
  //         is_email_verified: userResponse?.is_email_verified,
  //         is_tour_completed: userResponse?.is_tour_completed,
  //         onboarding_step: userResponse?.onboarding_step,
  //         is_onboarded: userResponse?.is_onboarded,
  //         role: userResponse?.role,
  //       };
  //       runInAction(() => {
  //         this.currentUser = userPayload;
  //       });
  //       return userPayload;
  //     }
  //   } catch (error) {
  //     console.error("Updating user error", error);
  //     return error;
  //   }
  // };

  // updateCurrentUserSettings = async (userTheme: ICurrentUserSettings) => {
  //   try {
  //     let userSettingsResponse: ICurrentUserSettings = await UserService.updateUser(userTheme);
  //     userSettingsResponse = userSettingsResponse || null;
  //     if (userSettingsResponse) {
  //       const themePayload = {
  //         theme: { ...userSettingsResponse?.theme },
  //       };
  //       runInAction(() => {
  //         this.currentUserSettings = themePayload;
  //         this.rootStore.theme.setTheme(themePayload);
  //       });
  //       return themePayload;
  //     }
  //   } catch (error) {
  //     console.error("Updating user settings error", error);
  //     return error;
  //   }
  // };

  // init load
  initialLoad() {}
}

export default UserStore;

import { action, observable, runInAction, makeObservable } from "mobx";
// services
import { UserService } from "services/user.service";
import { AuthService } from "services/auth.service";
// interfaces
import { IUser, IUserSettings } from "types/users";
// store
import { RootStore } from "../root.store";
import { IUserMembershipStore, UserMembershipStore } from "./user-membership.store";

export interface IUserStore {
  // states
  currentUserError: any | null;
  // observables
  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  isUserInstanceAdmin: boolean | null;
  currentUserSettings: IUserSettings | null;
  dashboardInfo: any;
  // fetch actions
  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserInstanceAdminStatus: () => Promise<boolean>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;
  fetchUserDashboardInfo: (workspaceSlug: string, month: number) => Promise<any>;
  // crud actions
  updateUserOnBoard: () => Promise<void>;
  updateTourCompleted: () => Promise<void>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
  updateCurrentUserTheme: (theme: string) => Promise<IUser>;

  deactivateAccount: () => Promise<void>;
  signOut: () => Promise<void>;

  membership: IUserMembershipStore;
}

export class UserStore implements IUserStore {
  // states
  currentUserError: any | null = null;
  // observables
  isUserLoggedIn: boolean | null = null;
  currentUser: IUser | null = null;
  isUserInstanceAdmin: boolean | null = null;
  currentUserSettings: IUserSettings | null = null;

  dashboardInfo: any = null;
  membership: UserMembershipStore;

  // root store
  rootStore;
  // services
  userService;
  authService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      currentUserError: observable.ref,
      // observable
      currentUser: observable,
      isUserInstanceAdmin: observable.ref,
      currentUserSettings: observable,
      dashboardInfo: observable,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserInstanceAdminStatus: action,
      fetchCurrentUserSettings: action,
      fetchUserDashboardInfo: action,
      updateUserOnBoard: action,
      updateTourCompleted: action,
      updateCurrentUser: action,
      updateCurrentUserTheme: action,
      deactivateAccount: action,
      signOut: action,
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.authService = new AuthService();
    this.membership = new UserMembershipStore(_rootStore);
  }

  /**
   * Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    try {
      const response = await this.userService.currentUser();
      runInAction(() => {
        this.isUserLoggedIn = true;
        this.currentUser = response;
        this.currentUserError = null;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.currentUserError = error;
      });
      throw error;
    }
  };

  /**
   * Fetches the current user instance admin status
   * @returns Promise<boolean>
   */
  fetchCurrentUserInstanceAdminStatus = async () =>
    await this.userService.currentUserInstanceAdminStatus().then((response) => {
      runInAction(() => {
        this.isUserInstanceAdmin = response.is_instance_admin;
      });
      return response.is_instance_admin;
    });

  /**
   * Fetches the current user settings
   * @returns Promise<IUserSettings>
   */
  fetchCurrentUserSettings = async () =>
    await this.userService.currentUserSettings().then((response) => {
      runInAction(() => {
        this.currentUserSettings = response;
      });
      return response;
    });

  /**
   * Fetches the current user dashboard info
   * @returns Promise<IUserWorkspaceDashboard>
   */
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

  /**
   * Updates the user onboarding status
   * @returns Promise<void>
   */
  updateUserOnBoard = async () => {
    const user = this.currentUser ?? undefined;
    if (!user) return;
    await this.userService.updateUserOnBoard().then(() => {
      runInAction(() => {
        this.currentUser = {
          ...this.currentUser,
          is_onboarded: true,
        } as IUser;
      });
    });
  };

  /**
   * Updates the user tour completed status
   * @returns Promise<void>
   */
  updateTourCompleted = async () => {
    if (this.currentUser) {
      return await this.userService.updateUserTourCompleted().then(() => {
        runInAction(() => {
          this.currentUser = {
            ...this.currentUser,
            is_tour_completed: true,
          } as IUser;
        });
      });
    }
  };

  /**
   * Updates the current user
   * @param data
   * @returns Promise<IUser>
   */
  updateCurrentUser = async (data: Partial<IUser>) =>
    await this.userService.updateUser(data).then((response) => {
      runInAction(() => {
        this.currentUser = response;
      });
      return response;
    });

  /**
   * Updates the current user theme
   * @param theme
   * @returns Promise<IUser>
   */
  updateCurrentUserTheme = async (theme: string) =>
    await this.userService
      .updateUser({
        theme: { ...this.currentUser?.theme, theme },
      } as IUser)
      .then((response) => {
        runInAction(() => {
          this.currentUser = {
            ...this.currentUser,
            theme: {
              ...this.currentUser?.theme,
              theme,
            },
          } as IUser;
        });
        return response;
      });

  /**
   * Deactivates the current user
   * @returns Promise<void>
   */
  deactivateAccount = async () =>
    await this.userService.deactivateAccount().then(() => {
      runInAction(() => {
        this.currentUser = null;
        this.currentUserError = null;
        this.isUserLoggedIn = false;
      });
    });

  /**
   * Signs out the current user
   * @returns Promise<void>
   */
  signOut = async () =>
    await this.authService.signOut().then(() => {
      runInAction(() => {
        this.currentUser = null;
        this.isUserLoggedIn = false;
      });
    });
}

import { action, observable, runInAction, makeObservable, computed } from "mobx";
// services
import { UserService } from "services/user.service";
import { AuthService } from "services/auth.service";
// interfaces
import { IUser, IUserSettings } from "types/users";
// store
import { RootStore } from "../root.store";
import { UserMembershipStore } from "./user-membership.store";

export interface IUserStore {
  loader: boolean;
  currentUserError: any;

  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  isUserInstanceAdmin: boolean | null;
  currentUserSettings: IUserSettings | null;

  dashboardInfo: any;

  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserInstanceAdminStatus: () => Promise<boolean>;
  fetchCurrentUserSettings: () => Promise<IUserSettings>;

  fetchUserDashboardInfo: (workspaceSlug: string, month: number) => Promise<any>;

  updateUserOnBoard: () => Promise<void>;
  updateTourCompleted: () => Promise<void>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
  updateCurrentUserTheme: (theme: string) => Promise<IUser>;

  deactivateAccount: () => Promise<void>;
  signOut: () => Promise<void>;

  membership: UserMembershipStore;
}

export class UserStore implements IUserStore {
  loader: boolean = false;
  currentUserError: any = null;

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
      // observable
      loader: observable.ref,
      isUserLoggedIn: observable.ref,
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
      this.currentUserError = null;
      this.currentUser = null;
      this.isUserLoggedIn = false;
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

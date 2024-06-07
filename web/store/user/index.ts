import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { IUser } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
// stores
import { RootStore } from "@/store/root.store";
import { IAccountStore } from "@/store/user/account.store";
import { ProfileStore, IUserProfileStore } from "@/store/user/profile.store";
import { IUserMembershipStore, UserMembershipStore } from "@/store/user/user-membership.store";
import { IUserSettingsStore, UserSettingsStore } from "./settings.store";

type TUserErrorStatus = {
  status: string;
  message: string;
};

export interface IUserStore {
  // observables
  isAuthenticated: boolean;
  isLoading: boolean;
  error: TUserErrorStatus | undefined;
  data: IUser | undefined;
  // store observables
  userProfile: IUserProfileStore;
  userSettings: IUserSettingsStore;
  accounts: Record<string, IAccountStore>;
  membership: IUserMembershipStore;
  // actions
  fetchCurrentUser: () => Promise<IUser | undefined>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser | undefined>;
  handleSetPassword: (csrfToken: string, data: { password: string }) => Promise<IUser | undefined>;
  deactivateAccount: () => Promise<void>;
  reset: () => void;
  signOut: () => Promise<void>;
}

export class UserStore implements IUserStore {
  // observables
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: TUserErrorStatus | undefined = undefined;
  data: IUser | undefined = undefined;
  // store observables
  userProfile: IUserProfileStore;
  userSettings: IUserSettingsStore;
  accounts: Record<string, IAccountStore> = {};
  membership: IUserMembershipStore;
  // service
  userService: UserService;
  authService: AuthService;

  constructor(private store: RootStore) {
    // stores
    this.userProfile = new ProfileStore(store);
    this.userSettings = new UserSettingsStore();
    this.membership = new UserMembershipStore(store);
    // service
    this.userService = new UserService();
    this.authService = new AuthService();
    // observables
    makeObservable(this, {
      // observables
      isAuthenticated: observable.ref,
      isLoading: observable.ref,
      error: observable,
      // model observables
      data: observable,
      userProfile: observable,
      userSettings: observable,
      accounts: observable,
      membership: observable,
      // actions
      fetchCurrentUser: action,
      updateCurrentUser: action,
      handleSetPassword: action,
      deactivateAccount: action,
      reset: action,
      signOut: action,
    });
  }

  /**
   * @description fetches the current user
   * @returns {Promise<IUser>}
   */
  fetchCurrentUser = async (): Promise<IUser> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const user = await this.userService.currentUser();
      if (user && user?.id) {
        await Promise.all([
          this.userProfile.fetchUserProfile(),
          this.userSettings.fetchCurrentUserSettings(),
          this.store.workspaceRoot.fetchWorkspaces(),
        ]);
        runInAction(() => {
          this.data = user;
          this.isLoading = false;
          this.isAuthenticated = true;
        });
      } else
        runInAction(() => {
          this.data = user;
          this.isLoading = false;
          this.isAuthenticated = false;
        });
      return user;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.isAuthenticated = false;
        this.error = {
          status: "user-fetch-error",
          message: "Failed to fetch current user",
        };
      });
      throw error;
    }
  };

  /**
   * @description updates the current user
   * @param data
   * @returns {Promise<IUser>}
   */
  updateCurrentUser = async (data: Partial<IUser>): Promise<IUser> => {
    const currentUserData = this.data;
    try {
      if (currentUserData) {
        Object.keys(data).forEach((key: string) => {
          const userKey: keyof IUser = key as keyof IUser;
          if (this.data) set(this.data, userKey, data[userKey]);
        });
      }
      const user = await this.userService.updateUser(data);
      return user;
    } catch (error) {
      if (currentUserData) {
        Object.keys(currentUserData).forEach((key: string) => {
          const userKey: keyof IUser = key as keyof IUser;
          if (this.data) set(this.data, userKey, currentUserData[userKey]);
        });
      }
      runInAction(() => {
        this.error = {
          status: "user-update-error",
          message: "Failed to update current user",
        };
      });
      throw error;
    }
  };

  /**
   * @description update the user password
   * @param data
   * @returns {Promise<IUser>}
   */
  handleSetPassword = async (csrfToken: string, data: { password: string }): Promise<IUser | undefined> => {
    const currentUserData = cloneDeep(this.data);
    try {
      if (currentUserData && currentUserData.is_password_autoset && this.data) {
        const user = await this.authService.setPassword(csrfToken, { password: data.password });
        set(this.data, ["is_password_autoset"], false);
        return user;
      }
      return undefined;
    } catch (error) {
      if (this.data) set(this.data, ["is_password_autoset"], true);
      runInAction(() => {
        this.error = {
          status: "user-update-error",
          message: "Failed to update current user",
        };
      });
      throw error;
    }
  };

  /**
   * @description deactivates the current user
   * @returns {Promise<void>}
   */
  deactivateAccount = async (): Promise<void> => {
    await this.userService.deactivateAccount();
    this.store.resetOnSignOut();
  };

  /**
   * @description resets the user store
   * @returns {void}
   */
  reset = (): void => {
    runInAction(() => {
      this.isAuthenticated = false;
      this.isLoading = false;
      this.error = undefined;
      this.data = undefined;
      this.userProfile = new ProfileStore(this.store);
      this.userSettings = new UserSettingsStore();
      this.membership = new UserMembershipStore(this.store);
    });
  };

  /**
   * @description signs out the current user
   * @returns {Promise<void>}
   */
  signOut = async (): Promise<void> => {
    await this.authService.signOut(API_BASE_URL);
    this.store.resetOnSignOut();
  };
}

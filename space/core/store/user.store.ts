import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { IUser } from "@plane/types";
// services
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
// store types
import { ProfileStore, IProfileStore } from "@/store/profile.store";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import { ActorDetail } from "@/types/issue";

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
  profile: IProfileStore;
  // computed
  currentActor: ActorDetail;
  // actions
  fetchCurrentUser: () => Promise<IUser | undefined>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser | undefined>;
  hydrate: (data: IUser | undefined) => void;
  reset: () => void;
  signOut: () => Promise<void>;
}

export class UserStore implements IUserStore {
  // observables
  isAuthenticated: boolean = false;
  isLoading: boolean = true;
  error: TUserErrorStatus | undefined = undefined;
  data: IUser | undefined = undefined;
  // store observables
  profile: IProfileStore;
  // service
  userService: UserService;
  authService: AuthService;

  constructor(private store: CoreRootStore) {
    // stores
    this.profile = new ProfileStore(store);
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
      profile: observable,
      // computed
      currentActor: computed,
      // actions
      fetchCurrentUser: action,
      updateCurrentUser: action,
      reset: action,
      signOut: action,
    });
  }

  // computed
  get currentActor(): ActorDetail {
    return {
      id: this.data?.id,
      first_name: this.data?.first_name,
      last_name: this.data?.last_name,
      display_name: this.data?.display_name,
      avatar_url: this.data?.avatar_url || undefined,
      is_bot: false,
    };
  }

  // actions
  /**
   * @description fetches the current user
   * @returns {Promise<IUser>}
   */
  fetchCurrentUser = async (): Promise<IUser> => {
    try {
      runInAction(() => {
        if (this.data === undefined) this.isLoading = true;
        this.error = undefined;
      });
      const user = await this.userService.currentUser();
      if (user && user?.id) {
        await this.profile.fetchUserProfile();
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

  hydrate = (data: IUser | undefined): void => {
    if (!data) return;
    this.data = { ...this.data, ...data };
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
      this.profile = new ProfileStore(this.store);
    });
  };

  /**
   * @description signs out the current user
   * @returns {Promise<void>}
   */
  signOut = async (): Promise<void> => {
    this.store.reset();
  };
}

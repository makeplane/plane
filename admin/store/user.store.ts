import { action, observable, runInAction, makeObservable } from "mobx";
import { IUser } from "@plane/types";
// helpers
import { EUserStatus, TUserStatus } from "@/helpers";
// services
import { UserService } from "@/services/user.service";
// root store
import { RootStore } from "@/store/root-store";
import { AuthService } from "@/services";

export interface IUserStore {
  // observables
  isLoading: boolean;
  userStatus: TUserStatus | undefined;
  isUserLoggedIn: boolean | undefined;
  currentUser: IUser | undefined;
  // fetch actions
  fetchCurrentUser: () => Promise<IUser>;
  signOut: () => Promise<void>;
}

export class UserStore implements IUserStore {
  // observables
  isLoading: boolean = true;
  userStatus: TUserStatus | undefined = undefined;
  isUserLoggedIn: boolean | undefined = undefined;
  currentUser: IUser | undefined = undefined;
  // services
  userService;
  authService;
  // rootStore
  rootStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      userStatus: observable,
      isUserLoggedIn: observable.ref,
      currentUser: observable,
      // action
      fetchCurrentUser: action,
    });
    this.userService = new UserService();
    this.authService = new AuthService();
    this.rootStore = store;
  }

  /**
   * @description Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    try {
      if (this.currentUser === undefined) this.isLoading = true;
      const currentUser = await this.userService.currentUser();
      runInAction(() => {
        this.isUserLoggedIn = true;
        this.currentUser = currentUser;
        this.isLoading = false;
      });
      return currentUser;
    } catch (error: any) {
      this.isLoading = false;
      this.isUserLoggedIn = false;
      if (error.status === 403)
        this.userStatus = {
          status: EUserStatus.AUTHENTICATION_NOT_DONE,
          message: error?.message || "",
        };
      else
        this.userStatus = {
          status: EUserStatus.ERROR,
          message: error?.message || "",
        };
      throw error;
    }
  };

  signOut = async () => {
    this.rootStore.resetOnSignOut();
  };
}

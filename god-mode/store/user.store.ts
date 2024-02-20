import { action, observable, runInAction, makeObservable } from "mobx";
// services
import { UserService } from "services/user.service";
import { AuthService } from "services/auth.service";
// interfaces
import { IUser } from "@plane/types";

export interface IUserStore {
  // states
  currentUserError: any | null;
  currentUserLoader: boolean;
  // observables
  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  isUserInstanceAdmin: boolean | null;
  // fetch actions
  fetchCurrentUser: () => Promise<IUser>;
  fetchCurrentUserInstanceAdminStatus: () => Promise<boolean>;

  signOut: () => Promise<void>;
}

export class UserStore implements IUserStore {
  // states
  currentUserError: any | null = null;
  currentUserLoader: boolean = false;
  // observables
  isUserLoggedIn: boolean | null = null;
  currentUser: IUser | null = null;
  isUserInstanceAdmin: boolean | null = null;

  // services
  userService;
  authService;

  constructor() {
    makeObservable(this, {
      // states
      currentUserError: observable.ref,
      currentUserLoader: observable.ref,
      // observable
      currentUser: observable,
      isUserInstanceAdmin: observable.ref,
      // action
      fetchCurrentUser: action,
      fetchCurrentUserInstanceAdminStatus: action,
      signOut: action,
    });
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  /**
   * Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    try {
      this.currentUserLoader = true;
      const response = await this.userService.currentUser();
      runInAction(() => {
        this.isUserLoggedIn = true;
        this.currentUser = response;
        this.currentUserError = null;
        this.currentUserLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.currentUserLoader = false;
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

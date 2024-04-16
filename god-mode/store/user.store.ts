import { action, observable, runInAction, makeObservable } from "mobx";
// services
import { UserService } from "services/user.service";
// interfaces
import { IUser } from "@plane/types";
// root store
import { RootStore } from "@/store/root-store";

export interface IUserStore {
  // observables
  isLoading: boolean;
  isUserLoggedIn: boolean | null;
  currentUser: IUser | null;
  // fetch actions
  fetchCurrentUser: () => Promise<IUser>;
}

export class UserStore implements IUserStore {
  // observables
  isLoading: boolean = true;
  isUserLoggedIn: boolean | null = null;
  currentUser: IUser | null = null;
  // services
  userService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      isUserLoggedIn: observable.ref,
      currentUser: observable,
      // action
      fetchCurrentUser: action,
    });
    this.userService = new UserService();
  }

  /**
   * @description Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    try {
      this.isLoading = true;
      const response = await this.userService.currentUser();
      runInAction(() => {
        this.isUserLoggedIn = true;
        this.currentUser = response;

        this.isLoading = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  };
}

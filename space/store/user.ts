// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import { UserService } from "services/user.service";
// types
import { IUser } from "types/user";

export interface IUserStore {
  loader: boolean;
  error: any | null;
  currentUser: any | null;
  fetchCurrentUser: () => Promise<IUser | undefined>;
  currentActor: () => any;
}

class UserStore implements IUserStore {
  loader: boolean = false;
  error: any | null = null;

  currentUser: IUser | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,

      currentUser: observable.ref,
      // actions
      setCurrentUser: action,
      // computed
      currentActor: computed,
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
  }

  setCurrentUser = (user: any) => {
    runInAction(() => {
      this.currentUser = { ...user };
    });
  };

  get currentActor(): any {
    return {
      avatar: this.currentUser?.avatar,
      display_name: this.currentUser?.display_name,
      first_name: this.currentUser?.first_name,
      id: this.currentUser?.id,
      is_bot: false,
      last_name: this.currentUser?.last_name,
    };
  }

  /**
   *
   * @param callback
   * @description A wrapper function to check user authentication; it redirects to the login page if not authenticated, otherwise, it executes a callback.
   * @example this.requiredLogin(() => { // do something });
   */

  requiredLogin = (callback: () => void) => {
    if (this.currentUser) {
      callback();
      return;
    }

    const currentPath = window.location.pathname + window.location.search;
    this.fetchCurrentUser()
      .then(() => {
        if (!this.currentUser) window.location.href = `/?next_path=${currentPath}`;
        else callback();
      })
      .catch(() => (window.location.href = `/?next_path=${currentPath}`));
  };

  fetchCurrentUser = async () => {
    try {
      this.loader = true;
      this.error = null;
      const response = await this.userService.currentUser();

      if (response)
        runInAction(() => {
          this.loader = false;
          this.currentUser = response;
        });
      return response;
    } catch (error) {
      console.error("Failed to fetch current user", error);
      this.loader = false;
      this.error = error;
    }
  };
}

export default UserStore;

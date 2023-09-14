// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import UserService from "services/user.service";
import { ActorDetail } from "types/issue";
// types
import { IUser } from "types/user";

export interface IUserStore {
  currentUser: any | null;
  fetchCurrentUser: () => void;
  currentActor: () => any;
}

class UserStore implements IUserStore {
  currentUser: IUser | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
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
      const response = await this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUser = response;
        });
      }
    } catch (error) {
      console.error("Failed to fetch current user", error);
    }
  };
}

export default UserStore;

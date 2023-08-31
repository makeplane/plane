// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import UserService from "services/user.service";

export interface IUserStore {
  currentUser: any | null;
  fetchCurrentUser: () => void;
}

class UserStore implements IUserStore {
  currentUser: any | null = null;
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
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
  }

  setCurrentUser = (user: any) => {
    // TODO: destructure user object
    this.currentUser = user;
  };

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

    this.fetchCurrentUser()
      .then(() => {
        if (!this.currentUser) {
          const currentPath = window.location.pathname;
          window.location.href = `/?next_path=${currentPath}`;
        } else callback();
      })
      .catch(() => {
        const currentPath = window.location.pathname;
        window.location.href = `/?next_path=${currentPath}`;
      });
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

// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import UserService from "services/user.service";
// types
import { IUserStore } from "../types";

class UserStore implements IUserStore {
  currentUser: any | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentUser: observable,
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

    this.getUserAsync()
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

  getUserAsync = async () => {
    try {
      const response = await this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUser = response;
        });
      }
    } catch (error) {
      console.error("error", error);
      runInAction(() => {
        // render error actions
      });
    }
  };
}

export default UserStore;

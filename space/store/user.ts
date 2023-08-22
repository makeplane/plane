// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import UserService from "services/user.service";
// types
import { IUserStore } from "./types";

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
      // computed
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
  }

  getUserAsync = async () => {
    try {
      const response = this.userService.currentUser();
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

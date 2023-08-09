// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import UserService from "services/user.service";

class UserStore {
  currentUser: any | null = null;
  currentUserSettings: any | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentUser: observable,
      currentUserSettings: observable,
      // actions
      // computed
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.initialLoad();
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

  getUserSettingsAsync = async () => {
    try {
      const response = this.userService.currentUser();
      if (response) {
        runInAction(() => {
          this.currentUserSettings = response;
        });
      }
    } catch (error) {
      console.error("error", error);
      runInAction(() => {
        // render error actions
      });
    }
  };

  setCurrentUserSettings = async () => {};

  // init load
  initialLoad() {}
}

export default UserStore;

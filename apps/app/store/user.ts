// mobx
import { action, observable, computed, makeObservable } from "mobx";
// services
import UserService from "services/user.service";
// interfaces
import { ICurrentUser, ICurrentUserSettings } from "types/users";

class UserStore {
  currentUser: ICurrentUser | null = null;
  currentUserSettings: ICurrentUserSettings | null = null;
  // root store
  rootStore;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentUser: observable.ref,
      currentUserSettings: observable.ref,
      // action
      setCurrentUser: action,
      setCurrentUserSettings: action,
      updateCurrentUser: action,
      updateCurrentUserSettings: action,
      // computed
    });
    this.rootStore = _rootStore;
    this.initialLoad();
  }

  setCurrentUser = async () => {
    try {
      let userResponse: ICurrentUser | null = await UserService.currentUser();
      userResponse = userResponse || null;
      if (userResponse) {
        this.currentUser = {
          id: userResponse?.id,
          avatar: userResponse?.avatar,
          first_name: userResponse?.first_name,
          last_name: userResponse?.last_name,
          username: userResponse?.username,
          email: userResponse?.email,
          mobile_number: userResponse?.mobile_number,
          is_email_verified: userResponse?.is_email_verified,
          is_tour_completed: userResponse?.is_tour_completed,
          onboarding_step: userResponse?.onboarding_step,
          is_onboarded: userResponse?.is_onboarded,
          role: userResponse?.role,
        };
      }
    } catch (error) {
      console.error("Fetching current user error", error);
    }
  };

  setCurrentUserSettings = async () => {
    try {
      let userSettingsResponse: ICurrentUserSettings | null = await UserService.currentUser();
      userSettingsResponse = userSettingsResponse || null;
      if (userSettingsResponse) {
        this.currentUserSettings = {
          theme: userSettingsResponse?.theme,
        };
        this.rootStore.theme.setTheme();
      }
    } catch (error) {
      console.error("Fetching current user error", error);
    }
  };

  updateCurrentUser = async (user: ICurrentUser) => {
    try {
      let userResponse: ICurrentUser = await UserService.updateUser(user);
      userResponse = userResponse || null;
      if (userResponse) {
        this.currentUser = userResponse;
        return userResponse;
      }
    } catch (error) {
      console.error("Updating user error", error);
      return error;
    }
  };

  updateCurrentUserSettings = async (userTheme: ICurrentUserSettings) => {
    try {
      let userSettingsResponse: ICurrentUserSettings = await UserService.updateUser(userTheme);
      userSettingsResponse = userSettingsResponse || null;
      if (userSettingsResponse) {
        this.currentUserSettings = userSettingsResponse;
        this.rootStore.theme.setTheme(userTheme);
        return userSettingsResponse;
      }
    } catch (error) {
      console.error("Updating user settings error", error);
      return error;
    }
  };

  // init load
  initialLoad() {
    this.setCurrentUser();
    this.setCurrentUserSettings();
  }
}

export default UserStore;

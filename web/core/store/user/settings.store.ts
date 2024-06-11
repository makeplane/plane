import { action, makeObservable, observable, runInAction } from "mobx";
import { IUserSettings } from "@plane/types";
// services
import { UserService } from "@/services/user.service";

type TError = {
  status: string;
  message: string;
};

export interface IUserSettingsStore {
  // observables
  isLoading: boolean;
  error: TError | undefined;
  data: IUserSettings;
  // actions
  fetchCurrentUserSettings: () => Promise<IUserSettings | undefined>;
}

export class UserSettingsStore implements IUserSettingsStore {
  // observables
  isLoading: boolean = false;
  error: TError | undefined = undefined;
  data: IUserSettings = {
    id: undefined,
    email: undefined,
    workspace: {
      last_workspace_id: undefined,
      last_workspace_slug: undefined,
      fallback_workspace_id: undefined,
      fallback_workspace_slug: undefined,
      invites: undefined,
    },
  };
  // services
  userService: UserService;

  constructor() {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      data: observable,
      // actions
      fetchCurrentUserSettings: action,
    });
    // services
    this.userService = new UserService();
  }

  // actions
  /**
   * @description fetches user profile information
   * @returns {Promise<IUserSettings | undefined>}
   */
  fetchCurrentUserSettings = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const userSettings = await this.userService.currentUserSettings();
      runInAction(() => {
        this.isLoading = false;
        this.data = userSettings;
      });
      return userSettings;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = {
          status: "error",
          message: "Failed to fetch user settings",
        };
      });
      throw error;
    }
  };
}

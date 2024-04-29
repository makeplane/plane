import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { UserService } from "services/user.service";
// types
import { IUserSettings, TUserProfile } from "@plane/types";

type TError = {
  status: string;
  message: string;
};

export interface IUserSettingsStore {
  // observables
  isLoading: boolean;
  data: IUserSettings;
  error: TError | undefined;
  // actions
  fetchCurrentUserSettings: () => Promise<IUserSettings | undefined>;
}

export class UserSettingsStore implements IUserSettingsStore {
  isLoading: boolean = false;
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
  error: TError | undefined = undefined;
  // services
  userService: UserService;

  constructor() {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      data: observable,
      error: observable,
      // actions
      fetchCurrentUserSettings: action,
    });
    // services
    this.userService = new UserService();
  }

  // actions
  fetchCurrentUserSettings = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const currentUserSettings = await this.userService.currentUserSettings();
      runInAction(() => {
        this.isLoading = false;
        this.data = currentUserSettings;
      });

      return currentUserSettings;
    } catch (error) {
      console.log("Failed to fetch profile details");
      runInAction(() => {
        this.isLoading = true;
        this.error = {
          status: "error",
          message: "Failed to fetch instance info",
        };
      });
    }
  };
}

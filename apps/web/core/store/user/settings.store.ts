import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { IUserSettings } from "@plane/types";
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
  sidebarCollapsed: boolean;
  isScrolled: boolean;
  // actions
  fetchCurrentUserSettings: (bustCache?: boolean) => Promise<IUserSettings | undefined>;
  toggleSidebar: (collapsed?: boolean) => void;
  toggleIsScrolled: (isScrolled?: boolean) => void;
}

export class UserSettingsStore implements IUserSettingsStore {
  // observables
  isLoading: boolean = false;
  sidebarCollapsed: boolean = true;
  error: TError | undefined = undefined;
  isScrolled: boolean = false;
  data: IUserSettings = {
    id: undefined,
    email: undefined,
    workspace: {
      last_workspace_id: undefined,
      last_workspace_slug: undefined,
      last_workspace_name: undefined,
      last_workspace_logo: undefined,
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
      sidebarCollapsed: observable.ref,
      isScrolled: observable.ref,
      // actions
      fetchCurrentUserSettings: action,
      toggleSidebar: action,
      toggleIsScrolled: action,
    });
    // services
    this.userService = new UserService();
  }

  // actions
  toggleSidebar = (collapsed?: boolean) => {
    this.sidebarCollapsed = collapsed ?? !this.sidebarCollapsed;
  };

  toggleIsScrolled = (isScrolled?: boolean) => {
    this.isScrolled = isScrolled ?? !this.isScrolled;
  };

  // actions
  /**
   * @description fetches user profile information
   * @returns {Promise<IUserSettings | undefined>}
   */
  fetchCurrentUserSettings = async (bustCache: boolean = false) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const userSettings = await this.userService.currentUserSettings(bustCache);
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

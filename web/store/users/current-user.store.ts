import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "../root.store";
import { IProfileStore, ProfileStore, IAccountStore, AccountStore } from "./";
// services
import { CurrentUserService, CurrentUserAccountsService } from "services/current-user";
// types
import { TCurrentUser, TCurrentUserSettings } from "@plane/types";

export interface ICurrentUserStore {
  // store
  profile: IProfileStore;
  // observables
  isAuthenticated: boolean;
  isLoading: boolean;
  data: TCurrentUser;
  settings: TCurrentUserSettings;
  error: any | undefined;
  accounts: Record<string, IAccountStore>;
  // actions
  // current user
  fetchCurrentUser: () => Promise<void>;
  fetchCurrentUserSettings: () => Promise<void>;
  // current user accounts
  fetchUserAccounts: () => Promise<void>;
}

export class CurrentUserStore implements ICurrentUserStore {
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  data: TCurrentUser = {
    id: undefined,
    avatar: undefined,
    cover_image: undefined,
    date_joined: undefined,
    display_name: undefined,
    email: undefined,
    first_name: undefined,
    last_name: undefined,
    is_active: false,
    is_bot: false,
    is_email_verified: false,
    is_managed: false,
    mobile_number: undefined,
    user_timezone: undefined,
    username: undefined,
    is_password_autoset: false,
  };
  settings: TCurrentUserSettings = {
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
  error: any | undefined = undefined;
  profile: IProfileStore;
  accounts: Record<string, IAccountStore> = {};
  // service
  currentUserService: CurrentUserService;
  currentUserAccountsService: CurrentUserAccountsService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isAuthenticated: observable.ref,
      isLoading: observable.ref,
      data: observable,
      settings: observable,
      error: observable,
      accounts: observable,
      // actions
      fetchCurrentUser: action,
      fetchCurrentUserSettings: action,
      fetchUserAccounts: action,
    });
    // service
    this.currentUserService = new CurrentUserService();
    this.currentUserAccountsService = new CurrentUserAccountsService();
    // stores initialization
    this.profile = new ProfileStore(store);
  }

  // actions
  fetchCurrentUser = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const user = await this.currentUserService.currentUser();
      runInAction(() => {
        Object.entries(user).map(([key, value]) => {
          set(this.data, [key], value ?? undefined);
        });
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.isLoading = true;
        this.error = { status: "", type: "", message: "" };
      });
    }
  };

  fetchCurrentUserSettings = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const userSettings = await this.currentUserService.currentUserSettings();
      runInAction(() => {
        Object.entries(userSettings).map(([key, value]) => {
          if (typeof value === "object") {
            Object.entries(value).map(([k, v]) => {
              set(this.settings, [key, k], v ?? undefined);
            });
          } else set(this.settings, [key], value ?? undefined);
        });
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.isLoading = true;
        this.error = { status: "", type: "", message: "" };
      });
    }
  };

  fetchUserAccounts = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const userAccounts = await this.currentUserAccountsService.fetch();
      console.log("userAccounts", userAccounts);
      runInAction(() => {
        Object.entries(userAccounts).map(([key, value]) => {
          set(this.accounts, [key], new AccountStore(this.store, value) ?? undefined);
        });
        this.isLoading = false;
      });
    } catch {
      runInAction(() => {
        this.isLoading = true;
        this.error = { status: "", type: "", message: "" };
      });
    }
  };
}

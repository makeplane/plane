import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "../root.store";
import { IProfileStore, ProfileStore, IAccountStore, AccountStore } from ".";
// services
import { UserService } from "services/user.service";
// types
import { IUser, TCurrentUser, TCurrentUserSettings } from "@plane/types";

export interface IUserStore {
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

export class UserStore implements IUserStore {
  // observables flags
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: any | undefined = undefined;
  // model observables
  avatar: string | undefined = undefined;
  cover_image: string | undefined = undefined;
  date_joined: string | undefined = undefined;
  display_name: string | undefined = undefined;
  email: string | undefined = undefined;
  first_name: string | undefined = undefined;
  id: string | undefined = undefined;
  is_active: boolean = false;
  is_bot: boolean = false;
  is_email_verified: boolean = false;
  last_name: string | undefined = undefined;
  user_timezone: string | undefined = undefined;
  // relational observables
  profile: IProfileStore;
  accounts: Record<string, IAccountStore> = {};
  // service
  userService: UserService;

  constructor(data: IUser) {
    makeObservable(this, {
      // observables
      isAuthenticated: observable.ref,
      isLoading: observable.ref,
      error: observable,
      // model observables
      avatar: observable.ref,
      cover_image: observable.ref,
      date_joined: observable.ref,
      display_name: observable.ref,
      email: observable.ref,
      first_name: observable.ref,
      id: observable.ref,
      is_active: observable.ref,
      is_bot: observable.ref,
      is_email_verified: observable.ref,
      last_name: observable.ref,
      user_timezone: observable.ref,
      // relational observables
      profile: observable,
      accounts: observable,
      // actions
      fetchCurrentUser: action,
      fetchCurrentUserSettings: action,
      fetchUserAccounts: action,
    });

    // service
    this.userService = new UserService();
    // stores initialization
    this.profile = new ProfileStore();
  }

  get asJson() {
    return {
      avatar: this.avatar,
      cover_image: this.cover_image,
      date_joined: this.date_joined,
      display_name: this.display_name,
      email: this.email,
      first_name: this.first_name,
      id: this.id,
      is_active: this.is_active,
      is_bot: this.is_bot,
      is_email_verified: this.is_email_verified,
      last_name: this.last_name,
      user_timezone: this.user_timezone,
      profile: this.profile.asJson,
      accounts: Object.entries(this.accounts).map(([key, value]) => value.asJson),
    };
  }

  updateUser = (data: Partial<TCurrentUser>) => {
    this.avatar = data?.avatar || this.avatar;
  };

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

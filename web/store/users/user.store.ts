import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { IProfileStore, ProfileStore, IAccountStore, AccountStore } from ".";
// services
import { UserService } from "services/user.service";
// types
import { IUser, TCurrentUser } from "@plane/types";
import { RootStore } from "store/root.store";

export interface IUserStore {
  // store
  profile: IProfileStore | undefined;
  // observables
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any | undefined;
  // model observables
  avatar: string | undefined;
  cover_image: string | null;
  date_joined: string | undefined;
  display_name: string | undefined;
  email: string | undefined;
  first_name: string | undefined;
  id: string | undefined;
  is_active: boolean;
  is_bot: boolean;
  is_email_verified: boolean;
  last_name: string | undefined;
  user_timezone: string | undefined;
  // relational observables
  accounts: Record<string, IAccountStore>;
  // computed
  asJson: TCurrentUser;
  // actions
  fetchCurrentUser: () => Promise<void>;
  fetchUserAccounts: () => Promise<void>;
}

export class UserStore implements IUserStore {
  // observables flags
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: any | undefined = undefined;
  // model observables
  avatar: string | undefined = undefined;
  cover_image: string | null = null;
  date_joined: string | undefined = undefined;
  display_name: string | undefined = undefined;
  email: string | undefined = undefined;
  first_name: string | undefined = undefined;
  id: string | undefined = undefined;
  is_active: boolean = false;
  is_bot: boolean = false;
  is_email_verified: boolean = false;
  is_password_autoset: boolean = false;
  last_name: string | undefined = undefined;
  username: string | undefined = undefined;
  user_timezone: string | undefined = undefined;
  // relational observables
  root: RootStore;
  profile: IProfileStore;
  accounts: Record<string, IAccountStore> = {};
  // service
  userService: UserService;

  constructor(rootStore: RootStore) {
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
      is_password_autoset: observable.ref,
      last_name: observable.ref,
      username: observable.ref,
      user_timezone: observable.ref,
      // relational observables
      profile: observable,
      accounts: observable,
      // actions
      fetchCurrentUser: action,
      fetchUserAccounts: action,
    });
    // stores
    this.root = rootStore;
    this.profile = new ProfileStore();
    // service
    this.userService = new UserService();
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
      is_password_autoset: this.is_password_autoset,
      last_name: this.last_name,
      username: this.username,
      user_timezone: this.user_timezone,
    };
  }

  updateUser = (data: Partial<TCurrentUser>) => {
    this.avatar = data?.avatar || this.avatar;
  };

  // actions
  fetchCurrentUser = async () => {
    const user = await this.userService.currentUser();
    runInAction(() => {
      this.avatar = user.avatar;
      this.cover_image = user.cover_image;
      this.date_joined = user.date_joined;
      this.display_name = user.display_name;
      this.email = user.email;
      this.first_name = user.first_name;
      this.id = user.id;
      this.is_active = user.is_active;
      this.is_bot = user.is_bot;
      this.is_email_verified = user.is_email_verified;
      this.last_name = user.last_name;
      this.user_timezone = user.user_timezone;
      this.isAuthenticated = true;
    });
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

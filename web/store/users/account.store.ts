import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "store/root.store";
// services
import { CurrentUserAccountsService } from "services/current-user";
// types
import { TCurrentUserAccount } from "@plane/types";

export interface IAccountStore {
  // observables
  isLoading: boolean;
  data: TCurrentUserAccount;
  error: any | undefined;
  // actions
  updateAccount: (accountData: Partial<TCurrentUserAccount>) => Promise<void>;
}

export class AccountStore implements IAccountStore {
  isLoading: boolean = false;
  data: TCurrentUserAccount = {
    id: undefined,
    user: undefined,
    provider_account_id: undefined,
    provider: undefined,
    access_token: undefined,
    access_token_expired_at: undefined,
    refresh_token: undefined,
    refresh_token_expired_at: undefined,
    last_connected_at: undefined,
    metadata: undefined,
    created_at: undefined,
    updated_at: undefined,
  };
  error: any | undefined = undefined;
  // service
  currentUserAccountsService: CurrentUserAccountsService;

  constructor(private store: RootStore, private _account: TCurrentUserAccount) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      data: observable,
      error: observable,
      // actions
      updateAccount: action,
    });
    // service
    this.currentUserAccountsService = new CurrentUserAccountsService();
    // set account data
    Object.entries(this._account).forEach(([key, value]) => {
      set(this.data, [key], value ?? undefined);
    });
  }

  // actions
  updateAccount = async (accountData: Partial<TCurrentUserAccount>) => {
    try {
      if (!this.data.id) return;

      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const account = await this.currentUserAccountsService.update(this.data.id, accountData);
      Object.entries(account).forEach(([key, value]) => {
        set(this.data, [key], value ?? undefined);
      });

      this.isLoading = false;
    } catch {
      runInAction(() => {
        this.isLoading = true;
        this.error = { status: "", type: "", message: "" };
      });
    }
  };
}

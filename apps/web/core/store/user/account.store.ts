import { set } from "lodash-es";
import { makeObservable, observable } from "mobx";
// types
import type { IUserAccount } from "@plane/types";
// services
import { UserService } from "@/services/user.service";
// store
import type { CoreRootStore } from "../root.store";

export interface IAccountStore {
  // observables
  isLoading: boolean;
  error: any | undefined;
  // model observables
  provider_account_id: string | undefined;
  provider: string | undefined;
}

export class AccountStore implements IAccountStore {
  isLoading: boolean = false;
  error: any | undefined = undefined;
  // model observables
  provider_account_id: string | undefined = undefined;
  provider: string | undefined = undefined;
  // service
  userService: UserService;
  constructor(
    private store: CoreRootStore,
    private _account: IUserAccount
  ) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      // model observables
      provider_account_id: observable.ref,
      provider: observable.ref,
    });
    // service
    this.userService = new UserService();
    // set account data
    Object.entries(this._account).forEach(([key, value]) => {
      set(this, [key], value ?? undefined);
    });
  }
}

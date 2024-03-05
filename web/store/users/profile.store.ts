import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { UserService } from "services/user.service";
// types
import { TUserProfile } from "@plane/types";

export interface IProfileStore {
  // observables
  isLoading: boolean;
  error: any | undefined;
  // model observables

  // computed
  // actions
  fetchUserProfile: () => Promise<void>;
}

export class ProfileStore implements IProfileStore {
  isLoading: boolean = false;
  isInitialDataUpdated: boolean = false;
  data: TUserProfile = {
    id: undefined,
    user: undefined,
    role: undefined,
    last_workspace_id: undefined,
    theme: {
      theme: undefined,
    },
    onboarding_step: {
      workspace_join: false,
      profile_complete: false,
      workspace_create: false,
      workspace_invite: false,
    },
    is_onboarded: false,
    is_tour_completed: false,
    use_case: undefined,
    billing_address_country: undefined,
    billing_address: undefined,
    has_billing_address: false,
    created_at: "",
    updated_at: "",
  };
  error: any | undefined = undefined;
  // service
  userService: UserService;

  constructor() {
    makeObservable(this, {
      // observables
      isInitialDataUpdated: observable.ref,
      isLoading: observable.ref,
      data: observable,
      error: observable,
      // computed
      // actions
      fetchUserProfile: action,
    });
    // service
    this.userService = new UserService();
  }

  // actions
  fetchUserProfile = async () => {
    const userProfile = await this.userService.getCurrentUserProfile();
    console.log("profile", userProfile);
    runInAction(() => {
      this.data = userProfile;
    });
  };
}

import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "store/root.store";
// services
import { CurrentUserProfileService } from "services/current-user";
// types
import { TUserProfile } from "@plane/types";

export interface IProfileStore {
  // observables
  isLoading: boolean;
  data: TUserProfile;
  error: any | undefined;
  // computed
  // actions
  fetchCurrentUserProfile: () => Promise<void>;
}

export class ProfileStore implements IProfileStore {
  isLoading: boolean = false;
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
  currentUserProfileService: CurrentUserProfileService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      data: observable,
      error: observable,
      // computed
      // actions
      fetchCurrentUserProfile: action,
    });
    // service
    this.currentUserProfileService = new CurrentUserProfileService();
  }

  // actions
  fetchCurrentUserProfile = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const userProfile = await this.currentUserProfileService.currentUserProfile();
      runInAction(() => {
        Object.entries(userProfile).map(([key, value]) => {
          if (typeof value === "object") {
            Object.entries(value).map(([k, v]) => {
              set(this.data, [key, k], v ?? undefined);
            });
          } else set(this.data, [key], value ?? undefined);
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

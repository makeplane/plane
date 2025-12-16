import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { UserService } from "@plane/services";
import type { TUserProfile } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
// store
import type { CoreRootStore } from "@/store/root.store";

type TError = {
  status: string;
  message: string;
};

export interface IProfileStore {
  // observables
  isLoading: boolean;
  error: TError | undefined;
  data: TUserProfile;
  // actions
  fetchUserProfile: () => Promise<TUserProfile | undefined>;
  updateUserProfile: (data: Partial<TUserProfile>) => Promise<TUserProfile | undefined>;
}

export class ProfileStore implements IProfileStore {
  isLoading: boolean = false;
  error: TError | undefined = undefined;
  data: TUserProfile = {
    id: undefined,
    user: undefined,
    role: undefined,
    last_workspace_id: undefined,
    theme: {
      theme: undefined,
      primary: undefined,
      background: undefined,
      darkPalette: undefined,
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
    has_marketing_email_consent: false,
    created_at: "",
    updated_at: "",
    language: "",
    start_of_the_week: EStartOfTheWeek.SUNDAY,
  };

  // services
  userService: UserService;

  constructor(public store: CoreRootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      data: observable,
      // actions
      fetchUserProfile: action,
      updateUserProfile: action,
    });
    // services
    this.userService = new UserService();
  }

  // actions
  /**
   * @description fetches user profile information
   * @returns {Promise<TUserProfile | undefined>}
   */
  fetchUserProfile = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const userProfile = await this.userService.profile();
      runInAction(() => {
        this.isLoading = false;
        this.data = userProfile;
      });
      return userProfile;
    } catch (_error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = {
          status: "user-profile-fetch-error",
          message: "Failed to fetch user profile",
        };
      });
    }
  };

  /**
   * @description updated the user profile information
   * @param {Partial<TUserProfile>} data
   * @returns {Promise<TUserProfile | undefined>}
   */
  updateUserProfile = async (data: Partial<TUserProfile>) => {
    const currentUserProfileData = this.data;
    try {
      if (currentUserProfileData) {
        Object.keys(data).forEach((key: string) => {
          const userKey: keyof TUserProfile = key as keyof TUserProfile;
          if (this.data) set(this.data, userKey, data[userKey]);
        });
      }
      const userProfile = await this.userService.updateProfile(data);
      return userProfile;
    } catch (_error) {
      if (currentUserProfileData) {
        Object.keys(currentUserProfileData).forEach((key: string) => {
          const userKey: keyof TUserProfile = key as keyof TUserProfile;
          if (this.data) set(this.data, userKey, currentUserProfileData[userKey]);
        });
      }
      runInAction(() => {
        this.error = {
          status: "user-profile-update-error",
          message: "Failed to update user profile",
        };
      });
    }
  };
}

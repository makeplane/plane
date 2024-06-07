import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { UserService } from "services/user.service";
// types
import { IUserTheme, TUserProfile } from "@plane/types";
import { RootStore } from "@/store/root.store";

type TError = {
  status: string;
  message: string;
};

export interface IUserProfileStore {
  // observables
  isLoading: boolean;
  error: TError | undefined;
  data: TUserProfile;
  // actions
  fetchUserProfile: () => Promise<TUserProfile | undefined>;
  updateUserProfile: (data: Partial<TUserProfile>) => Promise<TUserProfile | undefined>;
  updateUserOnBoard: () => Promise<TUserProfile | undefined>;
  updateTourCompleted: () => Promise<TUserProfile | undefined>;
  updateUserTheme: (data: Partial<IUserTheme>) => Promise<TUserProfile | undefined>;
}

export class ProfileStore implements IUserProfileStore {
  isLoading: boolean = false;
  error: TError | undefined = undefined;
  data: TUserProfile = {
    id: undefined,
    user: undefined,
    role: undefined,
    last_workspace_id: undefined,
    theme: {
      theme: undefined,
      text: undefined,
      palette: undefined,
      primary: undefined,
      background: undefined,
      darkPalette: undefined,
      sidebarText: undefined,
      sidebarBackground: undefined,
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

  // services
  userService: UserService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      data: observable,
      // actions
      fetchUserProfile: action,
      updateUserProfile: action,
      updateUserOnBoard: action,
      updateTourCompleted: action,
      updateUserTheme: action,
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
      const userProfile = await this.userService.getCurrentUserProfile();
      runInAction(() => {
        this.isLoading = false;
        this.data = userProfile;
      });
      return userProfile;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = {
          status: "user-profile-fetch-error",
          message: "Failed to fetch user profile",
        };
      });
      throw error;
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
      const userProfile = await this.userService.updateCurrentUserProfile(data);
      return userProfile;
    } catch (error) {
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

  /**
   * @description updates the user onboarding status
   * @returns @returns {Promise<TUserProfile | undefined>}
   */
  updateUserOnBoard = async () => {
    const isUserProfileOnboard = this.data.is_onboarded || false;
    try {
      runInAction(() => set(this.data, ["is_onboarded"], true));
      const userProfile = await this.userService.updateUserOnBoard();
      return userProfile;
    } catch (error) {
      runInAction(() => {
        set(this.data, ["is_onboarded"], isUserProfileOnboard);
        this.error = {
          status: "user-profile-onboard-error",
          message: "Failed to update user profile is_onboarded",
        };
      });

      throw error;
    }
  };

  /**
   * @description updates the user tour completed status
   * @returns @returns {Promise<TUserProfile | undefined>}
   */
  updateTourCompleted = async () => {
    const isUserProfileTourCompleted = this.data.is_tour_completed || false;
    try {
      runInAction(() => set(this.data, ["is_tour_completed"], true));
      const userProfile = await this.userService.updateUserTourCompleted();
      return userProfile;
    } catch (error) {
      runInAction(() => {
        set(this.data, ["is_tour_completed"], isUserProfileTourCompleted);
        this.error = {
          status: "user-profile-tour-complete-error",
          message: "Failed to update user profile is_tour_completed",
        };
      });
      throw error;
    }
  };

  /**
   * @description updates the user theme
   * @returns @returns {Promise<TUserProfile | undefined>}
   */
  updateUserTheme = async (data: Partial<IUserTheme>) => {
    const currentProfileTheme = cloneDeep(this.data.theme);
    try {
      runInAction(() => {
        Object.keys(data).forEach((key: string) => {
          const userKey: keyof IUserTheme = key as keyof IUserTheme;
          if (this.data.theme) set(this.data.theme, userKey, data[userKey]);
        });
      });
      const userProfile = await this.userService.updateCurrentUserProfile({ theme: this.data.theme });
      return userProfile;
    } catch (error) {
      runInAction(() => {
        Object.keys(data).forEach((key: string) => {
          const userKey: keyof IUserTheme = key as keyof IUserTheme;
          if (currentProfileTheme) set(this.data.theme, userKey, currentProfileTheme[userKey]);
        });
        this.error = {
          status: "user-profile-theme-update-error",
          message: "Failed to update user profile theme",
        };
      });
      throw error;
    }
  };
}

import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { EStartOfTheWeek, IUserTheme, TUserProfile } from "@plane/types";
// services
import { UserService } from "@/services/user.service";
// store
import { CoreRootStore } from "../root.store";

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
  finishUserOnboarding: () => Promise<void>;
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
      updateTourCompleted: action,
      updateUserTheme: action,
    });
    // services
    this.userService = new UserService();
  }

  // helper action
  mutateUserProfile = (data: Partial<TUserProfile>) => {
    if (!data) return;
    Object.entries(data).forEach(([key, value]) => {
      if (key in this.data) set(this.data, key, value);
    });
  };

  // actions
  /**
   * @description fetches user profile information
   * @returns {Promise<TUserProfile | undefined>}
   */
  fetchUserProfile = async (): Promise<TUserProfile | undefined> => {
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
  updateUserProfile = async (data: Partial<TUserProfile>): Promise<TUserProfile | undefined> => {
    const currentUserProfileData = this.data;
    try {
      if (currentUserProfileData) {
        this.mutateUserProfile(data);
      }
      const userProfile = await this.userService.updateCurrentUserProfile(data);
      return userProfile;
    } catch {
      if (currentUserProfileData) {
        this.mutateUserProfile(currentUserProfileData);
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
   * @description finishes the user onboarding
   * @returns { void }
   */
  finishUserOnboarding = async (): Promise<void> => {
    try {
      const firstWorkspace = Object.values(this.store.workspaceRoot.workspaces ?? {})?.[0];
      const dataToUpdate: Partial<TUserProfile> = {
        onboarding_step: {
          profile_complete: true,
          workspace_join: true,
          workspace_create: true,
          workspace_invite: true,
        },
        last_workspace_id: firstWorkspace?.id,
      };

      // update user onboarding steps
      await this.userService.updateCurrentUserProfile(dataToUpdate);

      // update user onboarding status
      await this.userService.updateUserOnBoard();

      // update the user profile store
      runInAction(() => {
        this.mutateUserProfile({ ...dataToUpdate, is_onboarded: true });
      });
    } catch (error) {
      runInAction(() => {
        this.error = {
          status: "user-profile-onboard-finish-error",
          message: "Failed to finish user onboarding",
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
      this.mutateUserProfile({ is_tour_completed: true });
      const userProfile = await this.userService.updateUserTourCompleted();
      return userProfile;
    } catch (error) {
      runInAction(() => {
        this.mutateUserProfile({ is_tour_completed: isUserProfileTourCompleted });
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

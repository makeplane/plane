import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { UserService } from "services/user.service";
// types
import { TUserProfile } from "@plane/types";

type TError = {
  status: string;
  message: string;
};

export interface IProfileStore {
  // observables
  isLoading: boolean;
  data: TUserProfile;
  error: TError | undefined;
  // actions
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<TUserProfile>) => Promise<void>;
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
  error: TError | undefined = undefined;
  // services
  userService: UserService;

  constructor() {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      data: observable,
      error: observable,
      // actions
      fetchUserProfile: action,
      updateUserProfile: action,
    });
    // services
    this.userService = new UserService();
  }

  // actions
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
    } catch (error) {
      console.log("Failed to fetch profile details");
      runInAction(() => {
        this.isLoading = true;
        this.error = {
          status: "error",
          message: "Failed to fetch instance info",
        };
      });
    }
  };

  updateUserProfile = async (data: Partial<TUserProfile>) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });
      const userProfile = await this.userService.updateCurrentUserProfile(data);
      runInAction(() => {
        this.isLoading = false;
        this.data = userProfile;
      });
    } catch (error) {
      console.log("Failed to fetch profile details");
      runInAction(() => {
        this.isLoading = true;
        this.error = {
          status: "error",
          message: "Failed to fetch instance info",
        };
      });
    }
  };
}

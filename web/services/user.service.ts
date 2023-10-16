// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import type {
  IIssue,
  IUser,
  IUserActivityResponse,
  IUserProfileData,
  IUserProfileProjectSegregation,
  IUserSettings,
  IUserWorkspaceDashboard,
} from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

const trackEventService = new TrackEventService();

export class UserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  currentUserConfig() {
    return {
      url: `${this.baseURL}/api/users/me/`,
      headers: this.getHeaders(),
    };
  }

  async userIssues(
    workspaceSlug: string,
    params: any
  ): Promise<
    | {
        [key: string]: IIssue[];
      }
    | IIssue[]
  > {
    return this.get(`/api/workspaces/${workspaceSlug}/my-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async currentUser(): Promise<IUser> {
    return this.get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async currentUserSettings(): Promise<IUserSettings> {
    return this.get("/api/users/me/settings/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateUser(data: Partial<IUser>): Promise<any> {
    return this.patch("/api/users/me/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserOnBoard({ userRole }: any, user: IUser | undefined): Promise<any> {
    return this.patch("/api/users/me/onboard/", {
      is_onboarded: true,
    })
      .then((response) => {
        trackEventService.trackUserOnboardingCompleteEvent(
          {
            user_role: userRole ?? "None",
          },
          user as IUser
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserTourCompleted(user: IUser): Promise<any> {
    return this.patch("/api/users/me/tour-completed/", {
      is_tour_completed: true,
    })
      .then((response) => {
        trackEventService.trackUserTourCompleteEvent({ user_role: user.role ?? "None" }, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserWorkspaceActivity(workspaceSlug: string): Promise<IUserActivityResponse> {
    return this.get(`/api/users/workspaces/${workspaceSlug}/activities/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userWorkspaceDashboard(workspaceSlug: string, month: number): Promise<IUserWorkspaceDashboard> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/dashboard/`, {
      params: {
        month: month,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async forgotPassword(data: { email: string }): Promise<any> {
    return this.post(`/api/forgot-password/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async resetPassword(
    uidb64: string,
    token: string,
    data: {
      new_password: string;
      confirm_password: string;
    }
  ): Promise<any> {
    return this.post(`/api/reset-password/${uidb64}/${token}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserProfileData(workspaceSlug: string, userId: string): Promise<IUserProfileData> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-stats/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserProfileProjectsSegregation(
    workspaceSlug: string,
    userId: string
  ): Promise<IUserProfileProjectSegregation> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-profile/${userId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserProfileActivity(workspaceSlug: string, userId: string): Promise<IUserActivityResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-activity/${userId}/?per_page=15`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserProfileIssues(
    workspaceSlug: string,
    userId: string,
    params: any
  ): Promise<
    | {
        [key: string]: IIssue[];
      }
    | IIssue[]
  > {
    return this.get(`/api/workspaces/${workspaceSlug}/user-issues/${userId}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

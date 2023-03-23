// services
import APIService from "services/api.service";
import type { IUser, IUserActivity, IUserWorkspaceDashboard } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class UserService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  currentUserConfig() {
    return {
      url: `${this.baseURL}/api/users/me/`,
      headers: this.getHeaders(),
    };
  }

  async userIssues(workspaceSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/my-issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async currentUser(): Promise<any> {
    if (!this.getAccessToken()) return null;
    return this.get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        this.purgeAccessToken();
        throw error?.response?.data;
      });
  }

  async updateUser(data: Partial<IUser>): Promise<any> {
    return this.patch("/api/users/me/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserOnBoard(): Promise<any> {
    return this.patch("/api/users/me/onboard/", { is_onboarded: true })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userActivity(workspaceSlug: string): Promise<IUserActivity[]> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/activity-graph/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userWorkspaceDashboard(workspaceSlug: string): Promise<IUserWorkspaceDashboard> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/dashboard/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new UserService();

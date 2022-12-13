// services
import { USER_ENDPOINT, USER_ISSUES_ENDPOINT, USER_ONBOARD_ENDPOINT } from "constants/api-routes";
import APIService from "lib/services/api.service";

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
    return this.get(USER_ISSUES_ENDPOINT(workspaceSlug))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async currentUser(): Promise<any> {
    if (!this.getAccessToken()) return null;
    return this.get(USER_ENDPOINT)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        this.purgeAccessToken();
        throw error?.response?.data;
      });
  }

  async updateUser(data = {}): Promise<any> {
    return this.patch(USER_ENDPOINT, data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserOnBoard(): Promise<any> {
    return this.patch(USER_ONBOARD_ENDPOINT, { is_onboarded: true })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new UserService();

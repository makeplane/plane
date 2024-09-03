// types
import type { IUser, IUserProjectsRole } from "@plane/types";
// services
import { API_BASE_URL, APIService } from "./api.service.js";

export class UserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  currentUserConfig() {
    return {
      url: `${this.baseURL}/api/users/me/`,
    };
  }

  async currentUser(cookie: string): Promise<IUser> {
    return this.get("/api/users/me/", {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async getUserAllProjectsRole(
    workspaceSlug: string,
    cookie: string
  ): Promise<IUserProjectsRole> {
    return this.get(
      `/api/users/me/workspaces/${workspaceSlug}/project-roles/`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

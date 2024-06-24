// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { IUser } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

interface IUserSession extends IUser {
  isAuthenticated: boolean;
}

export class UserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async authCheck(): Promise<IUserSession> {
    return this.get<any>("/api/instances/admins/me/")
      .then((response) => ({ ...response?.data, isAuthenticated: true }))
      .catch(() => ({ isAuthenticated: false }));
  }

  async currentUser(): Promise<IUser> {
    return this.get<IUser>("/api/instances/admins/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

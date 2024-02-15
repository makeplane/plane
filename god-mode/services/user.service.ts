// services
import { APIService } from "services/api.service";
// types
import type { IUser, IInstanceAdminStatus } from "@plane/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : "";

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

  async currentUser(): Promise<IUser> {
    return this.get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async currentUserInstanceAdminStatus(): Promise<IInstanceAdminStatus> {
    return this.get("/api/users/me/instance-admin/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

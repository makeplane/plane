// services
import { APIService } from "services/api.service";
// types
import type { IUser } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class UserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async currentUser(): Promise<IUser> {
    return this.get<IUser>("/api/instances/admins/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

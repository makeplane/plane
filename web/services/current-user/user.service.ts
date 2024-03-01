// services
import { APIService } from "services/api.service";
// types
import type { TCurrentUser, TCurrentUserSettings } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class CurrentUserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async currentUser(): Promise<TCurrentUser> {
    return this.get(`/api/users/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async currentUserSettings(): Promise<TCurrentUserSettings> {
    return this.get(`/api/users/me/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

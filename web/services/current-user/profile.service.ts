// services
import { APIService } from "services/api.service";
// types
import type { TCurrentUser } from "@plane/types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class CurrentUserProfileService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async currentUserProfile(): Promise<TCurrentUser> {
    return this.get(`/api/users/me/profile/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

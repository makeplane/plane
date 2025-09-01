// plane imports
import { API_BASE_URL, E_FEATURE_FLAGS } from "@plane/constants";
// local imports
import { APIService } from "../api.service";

export class SitesFeatureFlagService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async retrieve(anchor: string, flag: keyof typeof E_FEATURE_FLAGS): Promise<{ value: boolean }> {
    return this.get(`/api/public/anchor/${anchor}/flags/`, {
      params: {
        flag_key: flag,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

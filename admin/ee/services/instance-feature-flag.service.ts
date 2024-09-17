import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export type TInstanceFeatureFlagsResponse = {
  [featureFlag: string]: boolean;
};

export class InstanceFeatureFlagService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInstanceFeatureFlags(): Promise<TInstanceFeatureFlagsResponse> {
    return this.get<TInstanceFeatureFlagsResponse>("/api/instances/admins/feature-flags/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}

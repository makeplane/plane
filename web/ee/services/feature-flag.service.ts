import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export type TFeatureFlagsResponse = {
  values: {
    [featureFlag: string]: boolean;
  };
};

export class FeatureFlagService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getFeatureFlags(workspaceSlug: string): Promise<TFeatureFlagsResponse> {
    return this.get(`/api/payments/workspaces/${workspaceSlug}/flags/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

// services
import { APIService } from "@/services/api.service";

export type TFeatureFlagsResponse = {
  values: {
    [featureFlag: string]: boolean;
  };
};

export class FeatureFlagService extends APIService {
  constructor() {
    super("");
  }

  async getFeatureFlags(data = {}): Promise<TFeatureFlagsResponse> {
    return this.post(`/flags/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

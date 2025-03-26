// plane imports
import { API_BASE_URL } from "@plane/constants";
import { TInstanceFeatureFlagsResponse } from "@plane/types"
// services
import { APIService } from "../api.service";

/**
 * Service class for managing instance feature flags
 * Handles operations for retrieving instance feature flags
 * @extends {APIService}
 */
export class InstanceFeatureFlagService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(): Promise<TInstanceFeatureFlagsResponse> {
    return this.get("/api/instances/admins/feature-flags/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}

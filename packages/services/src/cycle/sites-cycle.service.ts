// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TPublicCycle } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing cycles within plane sites application.
 * Extends APIService to handle HTTP requests to the cycle-related endpoints.
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesCycleService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves list of cycles for a specific anchor.
   * @param anchor - The anchor identifier for the published entity
   * @returns {Promise<TPublicCycle[]>} The list of cycles
   * @throws {Error} If the request fails
   */
  async list(anchor: string): Promise<TPublicCycle[]> {
    return this.get(`/api/public/anchor/${anchor}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

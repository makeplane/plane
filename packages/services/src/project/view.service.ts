// plane imports
import { API_BASE_URL } from "@plane/constants";
// api services
import { APIService } from "../api.service";

export class ProjectViewService extends APIService {
  /**
   * Creates an instance of ProjectViewService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }
}

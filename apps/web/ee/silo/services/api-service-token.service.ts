import { API_BASE_URL } from "@plane/constants";
import { IApiToken } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class ApiTokenService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description create service api token for access the plane api endpoints to create the data in
   * @param workspaceSlug: string
   * @returns IApiToken
   */
  async createServiceApiToken(workspaceSlug: string): Promise<IApiToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/service-api-tokens/`, {} as Partial<IApiToken>)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const apiTokenService = new ApiTokenService();

export default apiTokenService;

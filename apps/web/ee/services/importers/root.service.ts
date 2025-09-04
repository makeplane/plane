import { API_BASE_URL } from "@plane/constants";
import { IApiToken } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class ExternalApiTokenService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description create service api token for access the plane external api's
   * @param workspaceSlug: string
   * @returns IApiToken
   */
  async externalServiceApiToken(workspaceSlug: string): Promise<IApiToken | undefined> {
    return this.post(`/api/workspaces/${workspaceSlug}/service-api-tokens/`, {} as Partial<IApiToken>)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const externalApiTokenService = new ExternalApiTokenService();

export default externalApiTokenService;

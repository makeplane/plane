import { API_BASE_URL } from "@plane/constants";
import { IApiToken } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ServiceAPITokenService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async createServiceApiToken(workspaceSlug: string, data: Partial<IApiToken>): Promise<IApiToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/service-api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

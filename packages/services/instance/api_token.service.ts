import { APIService } from "../api.service";
import { IApiToken } from "@plane/types";

export class APITokenService extends APIService {
  constructor(BASE_URL) {
    super(BASE_URL);
  }

  async getApiTokens(workspaceSlug: string): Promise<IApiToken[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveApiToken(
    workspaceSlug: string,
    tokenId: String
  ): Promise<IApiToken> {
    return this.get(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createApiToken(
    workspaceSlug: string,
    data: Partial<IApiToken>
  ): Promise<IApiToken> {
    return this.post(`/api/workspaces/${workspaceSlug}/api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteApiToken(
    workspaceSlug: string,
    tokenId: String
  ): Promise<IApiToken> {
    return this.delete(`/api/workspaces/${workspaceSlug}/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

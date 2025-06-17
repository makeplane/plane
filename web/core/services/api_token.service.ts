import { API_BASE_URL } from "@plane/constants";
import { IApiToken } from "@plane/types";
import { APIService } from "./api.service";

export class APITokenService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getApiTokens(): Promise<IApiToken[]> {
    return this.get(`/api/users/api-tokens/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveApiToken(tokenId: string): Promise<IApiToken> {
    return this.get(`/api/users/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createApiToken(data: Partial<IApiToken>): Promise<IApiToken> {
    return this.post(`/api/users/api-tokens/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteApiToken(tokenId: string): Promise<IApiToken> {
    return this.delete(`/api/users/api-tokens/${tokenId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

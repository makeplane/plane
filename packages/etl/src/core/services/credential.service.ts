import axios, { AxiosInstance } from "axios";
// types
import { TServiceAuthConfiguration, TImporterKeys } from "@/core/types";

export class CredentialService {
  public axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description check if the service is configured
   * @param workspaceId: string
   * @param userId: string
   * @param source: TImporterKeys
   * @returns TServiceAuthConfiguration
   */
  async isServiceConfigured(
    workspaceId: string,
    userId: string,
    source: TImporterKeys
  ): Promise<TServiceAuthConfiguration> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${source}`)
      .then((response) => response?.data)
      .catch((error) => error?.response?.data);
  }

  // TODO: Personal Access Token Service methods
}

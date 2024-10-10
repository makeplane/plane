import axios, { AxiosInstance } from "axios";
// types
import { TSyncServiceConfigured, TSyncServices } from "@/types";

export class SyncCredService {
  public axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description check if the service is configured
   * @param workspaceId: string
   * @param userId: string
   * @param source: TSyncServices
   * @returns TSyncServiceConfigured
   */
  async isServiceConfigured(
    workspaceId: string,
    userId: string,
    source: TSyncServices
  ): Promise<TSyncServiceConfigured> {
    return this.axiosInstance
      .get(`/silo/api/credentials/${workspaceId}/${userId}/?source=${source}`)
      .then((response) => response?.data)
      .catch((error) => error?.response?.data);
  }
}

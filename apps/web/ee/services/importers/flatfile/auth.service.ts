import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";

export class FlatfileAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description validate the CSV importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async csvAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.FLATFILE}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Save CSV credentials
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } externalApiToken
   * @returns { Promise<void> }
   */
  async saveCredentials(workspaceId: string, userId: string, externalApiToken: string): Promise<void> {
    return this.axiosInstance
      .post(`/api/flatfile/credentials/save`, {
        workspaceId,
        userId,
        externalApiToken,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Register webhook
   * @returns { Promise<void> }
   */
  async registerWebhook(): Promise<void> {}
}

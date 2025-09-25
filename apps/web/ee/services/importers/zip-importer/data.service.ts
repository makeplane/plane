import axios, { AxiosInstance } from "axios";
import { TServiceAuthConfiguration } from "@plane/etl/core";
import { EZipDriverType, TDocImporterJobConfig } from "@/plane-web/types/importers/zip-importer";

export interface IUploadUrlResponse {
  success: boolean;
  uploadUrl: string;
  uploadId: string;
  fileKey: string;
}

export interface IConfirmUploadResponse {
  success: boolean;
  message: string;
}

export class ZipImporterService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;
  private provider: EZipDriverType;

  constructor(baseURL: string, provider: EZipDriverType) {
    this.baseURL = baseURL;
    this.provider = provider;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  async startImport(workspaceId: string, userId: string, config: TDocImporterJobConfig): Promise<void> {
    return this.axiosInstance
      .post(`/api/zip-importer/${this.provider}/start-import`, {
        workspaceId,
        userId,
        config,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description validate the CSV importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async verifyCredentials(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${this.provider.toUpperCase()}`)
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
      .post(`/api/zip-importer/${this.provider}/credentials/save`, {
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
  async registerWebhook(): Promise<void> { }
}

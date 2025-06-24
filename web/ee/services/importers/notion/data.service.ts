import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";

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

export class NotionService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  async startImport(workspaceId: string, userId: string, fileKey: string, fileName?: string): Promise<void> {
    return this.axiosInstance
      .post(`/api/notion/start-import`, {
        workspaceId,
        userId,
        fileKey,
        fileName,
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
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.NOTION}`)
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
      .post(`/api/notion/credentials/save`, {
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
   * @description Get a presigned URL for uploading a Notion ZIP file
   * @param { string } workspaceId
   * @returns { Promise<IUploadUrlResponse> }
   */
  async getUploadUrl(workspaceId: string): Promise<IUploadUrlResponse> {
    return this.axiosInstance
      .post(`/api/notion/upload-zip`, {
        workspaceId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Upload a file to the presigned URL
   * @param { string } presignedUrl
   * @param { File } file
   * @param { (progress: number) => void } onProgress
   * @returns { Promise<string> } Returns the ETag header from the response
   */
  async uploadFileToS3(presignedUrl: string, file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Initial progress update
      if (onProgress) onProgress(0);

      const response = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": "application/zip",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Ensure progress never reaches 100% until completely done
            const adjustedProgress = Math.min(percentCompleted, 99);
            onProgress(adjustedProgress);
          }
        },
      });

      // Final progress update
      if (onProgress) onProgress(100);

      // Extract the ETag header - it might be in different case formats
      const etag =
        response.headers.etag ||
        response.headers.Etag ||
        response.headers.ETag ||
        response.headers["etag"] ||
        "";

      // Remove quotes if present
      return etag.replace(/"/g, "");
    } catch (error: any) {
      console.error("Error uploading file to S3:", error);
      throw error?.response?.data || error;
    }
  }

  /**
   * @description Confirm the upload was completed successfully
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } fileKey
   * @param { string } uploadId
   * @param { string } etag
   * @param { string } fileName - Original file name
   * @returns { Promise<IConfirmUploadResponse> }
   */
  async confirmUpload(
    workspaceId: string,
    userId: string,
    fileKey: string,
    uploadId: string,
    etag: string,
    fileName?: string
  ): Promise<IConfirmUploadResponse> {
    return this.axiosInstance
      .post(`/api/notion/confirm-upload`, {
        workspaceId,
        userId,
        fileKey,
        uploadId,
        etag,
        fileName,
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

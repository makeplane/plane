import axios, { AxiosInstance } from "axios";

// Types for Silo Assets
export interface ISiloUploadUrlResponse {
  upload_data: {
    url: string;
    fields: Record<string, string>;
  };
  asset_id: string;
  asset_url: string;
  asset_key: string;
  message: string;
}

export interface ISiloConfirmUploadResponse {
  message: string;
  asset_id: string;
  asset_url: string;
  actual_size: number;
  upload_status: string;
  status: boolean;
}

export interface ISiloAssetDetails {
  id: string;
  asset_url: string;
  size: number;
  is_uploaded: boolean;
  attributes: Record<string, any>;
  created_at: string;
}

export class SiloAssetsService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description Get a presigned URL for uploading a file via Silo Assets
   * @param { string } workspaceSlug
   * @param { string } fileName
   * @param { string } fileType
   * @param { number } fileSize
   * @returns { Promise<ISiloUploadUrlResponse> }
   */
  async getUploadUrl(
    workspaceSlug: string,
    fileName: string,
    fileType: string = "application/octet-stream",
    fileSize: number = 0
  ): Promise<ISiloUploadUrlResponse> {
    return this.axiosInstance
      .post(`/api/assets/silo/workspaces/${workspaceSlug}/`, {
        name: fileName,
        type: fileType,
        size: fileSize,
      })
      .then((res: any) => res.data)
      .catch((error: any) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Upload a file to S3 using the presigned URL
   * @param { ISiloUploadUrlResponse["upload_data"] } uploadData
   * @param { File } file
   * @param { (progress: number) => void } onProgress
   * @returns { Promise<string> } Returns the ETag header from the response
   */
  async uploadFileToS3(
    uploadData: ISiloUploadUrlResponse["upload_data"],
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Initial progress update
      if (onProgress) onProgress(0);

      // Create FormData for S3 upload
      const formData = new FormData();

      // Add all the fields from the presigned URL
      Object.entries(uploadData.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add the file last
      formData.append("file", file);

      const response = await axios.post(uploadData.url, formData, {
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
        response.headers.etag || response.headers.Etag || response.headers.ETag || response.headers["etag"] || "";

      // Remove quotes if present
      return etag.replace(/"/g, "");
    } catch (error: any) {
      console.error("Error uploading file to S3:", error);
      throw error?.response?.data || error;
    }
  }

  /**
   * @description Confirm the upload was completed successfully
   * @param { string } workspaceSlug
   * @param { string } assetId
   * @param { string } etag
   * @param { number } actualSize
   * @param { Record<string, any> } additionalAttributes
   * @returns { Promise<ISiloConfirmUploadResponse> }
   */

  async confirmUpload(
    workspaceSlug: string,
    assetId: string
  ): Promise<ISiloConfirmUploadResponse> {
    return this.axiosInstance
      .patch(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // async confirmUpload(
  //   workspaceSlug: string,
  //   assetId: string,
  //   etag: string,
  //   actualSize?: number,
  //   additionalAttributes?: Record<string, any>
  // ): Promise<ISiloConfirmUploadResponse> {
  //   return this.axiosInstance
  //     .patch(`/api/assets/silo/workspaces/${workspaceSlug}/${assetId}/`, {
  //       is_uploaded: true,
  //       upload_complete: true,
  //       status: "success",
  //       actual_size: actualSize,
  //       etag: etag,
  //       attributes: additionalAttributes,
  //     })
  //     .then((res: any) => res.data)
  //     .catch((error: any) => {
  //       throw error?.response?.data;
  //     });
  // }

  /**
   * @description Get asset details and download URL
   * @param { string } workspaceSlug
   * @param { string } assetId
   * @returns { Promise<ISiloAssetDetails> }
   */
  async getAsset(workspaceSlug: string, assetId: string): Promise<ISiloAssetDetails> {
    return this.axiosInstance
      .get(`/api/assets/silo/workspaces/${workspaceSlug}/${assetId}/`)
      .then((res: any) => res.data)
      .catch((error: any) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Delete an asset
   * @param { string } workspaceSlug
   * @param { string } assetId
   * @returns { Promise<{ message: string; status: boolean }> }
   */
  async deleteAsset(workspaceSlug: string, assetId: string): Promise<{ message: string; status: boolean }> {
    return this.axiosInstance
      .delete(`/api/assets/silo/workspaces/${workspaceSlug}/${assetId}/`)
      .then((res: any) => res.data)
      .catch((error: any) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Compatible method for existing upload flow (matches NotionService pattern)
   * @param { string } workspaceSlug
   * @param { File } file
   * @param { (progress: number) => void } onProgress
   * @returns { Promise<{ assetId: string; etag: string; fileKey: string }> }
   */
  async uploadFile(
    workspaceSlug: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ assetId: string; etag: string; fileKey: string }> {
    // Step 1: Get upload URL
    const uploadResponse = await this.getUploadUrl(workspaceSlug, file.name, file.type, file.size);

    // Step 2: Upload to S3
    const etag = await this.uploadFileToS3(uploadResponse.upload_data, file, onProgress);

    // Step 3: Confirm upload
    await this.confirmUpload(workspaceSlug, uploadResponse.asset_id);

    return {
      assetId: uploadResponse.asset_id,
      etag: etag,
      fileKey: uploadResponse.asset_key,
    };
  }
}

import { ExAsset, AssetUploadResponse } from "@plane/sdk";
import { ClientOptions } from "@/types";
import { APIService } from "../api.service";

interface AssetResponse {
  asset_id: string;
  asset_url: string;
  asset_name: string;
  asset_type: string;
}

export class AssetApiService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async createAsset(
    workspaceSlug: string,
    payload: {
      name: string;
      type: string;
      size: number;
      created_by: string;
      project_id?: string;
      external_id?: string;
      external_source?: string;
    }
  ): Promise<AssetUploadResponse> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/import-assets/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        if (error?.response?.status === 409) {
          return {
            ...error.response.data,
            already_exists: true,
          };
        }
        throw error?.response?.data;
      });
  }

  async uploadToPresignedUrl(uploadData: AssetUploadResponse["upload_data"], file: File): Promise<void> {
    const formData = new FormData();

    Object.entries(uploadData.fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);

    return fetch(uploadData.url, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Upload failed");
      })
      .catch((error) => {
        throw error;
      });
  }

  async uploadAsset(
    workspaceSlug: string,
    file: File,
    name: string,
    size: number,
    created_by: string,
    options?: {
      project_id?: string;
      external_id?: string;
      external_source?: string;
    }
  ): Promise<string> {
    // First get the presigned URL
    const uploadResponse = await this.createAsset(workspaceSlug, {
      name,
      type: file.type,
      size,
      created_by,
      project_id: options?.project_id,
      external_id: options?.external_id,
      external_source: options?.external_source,
    });

    if (uploadResponse.already_exists) {
      return uploadResponse.asset_id;
    }

    // Then upload the file
    await this.uploadToPresignedUrl(uploadResponse.upload_data, file);

    // Mark the asset as uploaded
    await this.updateAsset(workspaceSlug, uploadResponse.asset_id, {
      is_uploaded: true,
    });

    // Return the asset ID
    return uploadResponse.asset_id;
  }

  async updateAsset(
    workspaceSlug: string,
    assetId: string,
    payload: {
      is_uploaded: boolean;
    }
  ): Promise<ExAsset> {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/import-assets/${assetId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAssetInfo(workspaceSlug: string, assetId: string): Promise<AssetResponse> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/import-assets/${assetId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}


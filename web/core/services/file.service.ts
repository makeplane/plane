// plane types
import { TFileEntityInfo, TFileSignedURLResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "@/helpers/file.helper";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export interface UnSplashImage {
  id: string;
  created_at: Date;
  updated_at: Date;
  promoted_at: Date;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: null;
  alt_description: string;
  urls: UnSplashImageUrls;
  [key: string]: any;
}

export interface UnSplashImageUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
  small_s3: string;
}

export enum TFileAssetType {
  COMMENT_DESCRIPTION = "COMMENT_DESCRIPTION",
  ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT",
  ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION",
  PAGE_DESCRIPTION = "PAGE_DESCRIPTION",
  PROJECT_COVER = "PROJECT_COVER",
  USER_AVATAR = "USER_AVATAR",
  USER_COVER = "USER_COVER",
  WORKSPACE_LOGO = "WORKSPACE_LOGO",
}

export class FileService extends APIService {
  private cancelSource: any;
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    this.cancelUpload = this.cancelUpload.bind(this);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateWorkspaceAssetUploadStatus(workspaceSlug: string, assetId: string): Promise<void> {
    return this.patch(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadWorkspaceAsset(
    workspaceSlug: string,
    data: TFileEntityInfo,
    file: File
  ): Promise<TFileSignedURLResponse> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/`, {
      ...data,
      ...fileMetaData,
    })
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateWorkspaceAssetUploadStatus(workspaceSlug.toString(), signedURLResponse.asset_id);
        return signedURLResponse;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  private async updateUserAssetUploadStatus(assetId: string): Promise<void> {
    return this.patch(`/api/assets/v2/user-assets/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadUserAsset(data: TFileEntityInfo, file: File): Promise<TFileSignedURLResponse> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(`/api/assets/v2/user-assets/`, {
      ...data,
      ...fileMetaData,
    })
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateUserAssetUploadStatus(signedURLResponse.asset_id);
        return signedURLResponse;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteNewAsset(assetPath: string): Promise<void> {
    return this.delete(assetPath)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteOldEditorAsset(workspaceId: string, src: string): Promise<any> {
    const assetKey = this.extractAssetIdFromUrl(src);
    return this.delete(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/`)
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreNewAsset(workspaceSlug: string, src: string): Promise<void> {
    // remove the last slash and get the asset id
    const assetId = this.extractAssetIdFromUrl(src.slice(0, -1));
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreOldEditorAsset(workspaceId: string, src: string): Promise<void> {
    const assetKey = this.extractAssetIdFromUrl(src);
    return this.post(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  cancelUpload() {
    this.cancelSource.cancel("Upload canceled");
  }

  extractAssetIdFromUrl(src: string): string {
    const sourcePaths = src.split("/");
    const assetUrl = sourcePaths[sourcePaths.length - 1];
    return assetUrl;
  }

  async getUnsplashImages(query?: string): Promise<UnSplashImage[]> {
    return this.get(`/api/unsplash/`, {
      params: {
        query,
      },
    })
      .then((res) => res?.data?.results ?? res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getProjectCoverImages(): Promise<string[]> {
    return this.get(`/api/project-covers/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

import axios from "axios";
// plane types
import { TFileMetaData, TFileSignedURLResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { generateFileUploadPayload } from "@/helpers/file.helper";
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
  fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    this.uploadFile = this.uploadFile.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.restoreImage = this.restoreImage.bind(this);
    this.cancelUpload = this.cancelUpload.bind(this);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  async updateWorkspaceAssetStatus(workspaceSlug: string, assetId: string): Promise<void> {
    return this.patch(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceAssetSignedURL(workspaceSlug: string, data: TFileMetaData, file: File): Promise<string> {
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/`, data)
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateWorkspaceAssetStatus(workspaceSlug.toString(), signedURLResponse.asset_id);
        return signedURLResponse.asset_url;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateUserAssetStatus(assetId: string): Promise<void> {
    return this.patch(`/api/assets/v2/user-assets/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserAssetSignedURL(data: TFileMetaData, file: File): Promise<string> {
    return this.post(`/api/assets/v2/user-assets/`, data)
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateUserAssetStatus(signedURLResponse.asset_id);
        return signedURLResponse.asset_url;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadFile(workspaceSlug: string, file: FormData): Promise<any> {
    this.cancelSource = axios.CancelToken.source();
    return this.post(`/api/workspaces/${workspaceSlug}/file-assets/`, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: this.cancelSource.token,
    })
      .then((response) => response?.data)
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log(error.message);
        } else {
          console.log(error);
          throw error?.response?.data;
        }
      });
  }

  cancelUpload() {
    this.cancelSource.cancel("Upload cancelled");
  }

  getUploadFileFunction(
    workspaceSlug: string,
    setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
  ): (file: File) => Promise<string> {
    return async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("asset", file);
        formData.append("attributes", JSON.stringify({}));

        // the submitted state will be resolved by the page rendering the editor
        // once the patch request of saving the editor contents is resolved
        setIsSubmitting?.("submitting");

        const data = await this.uploadFile(workspaceSlug, formData);
        return data.asset;
      } catch (e) {
        console.error(e);
      }
    };
  }

  getDeleteImageFunction(workspaceId: string) {
    return async (src: string) => {
      try {
        const assetUrlWithWorkspaceId = `${workspaceId}/${this.extractAssetIdFromUrl(src, workspaceId)}`;
        const data = await this.deleteImage(assetUrlWithWorkspaceId);
        return data;
      } catch (e) {
        console.error(e);
      }
    };
  }

  getRestoreImageFunction(workspaceId: string) {
    return async (src: string) => {
      try {
        const assetUrlWithWorkspaceId = `${workspaceId}/${this.extractAssetIdFromUrl(src, workspaceId)}`;
        const data = await this.restoreImage(assetUrlWithWorkspaceId);
        return data;
      } catch (e) {
        console.error(e);
      }
    };
  }

  extractAssetIdFromUrl(src: string, workspaceId: string): string {
    const indexWhereAssetIdStarts = src.indexOf(workspaceId) + workspaceId.length + 1;
    if (indexWhereAssetIdStarts === -1) {
      throw new Error("Workspace ID not found in source string");
    }
    const assetUrl = src.substring(indexWhereAssetIdStarts);
    return assetUrl;
  }

  async deleteImage(assetUrlWithWorkspaceId: string): Promise<any> {
    return this.delete(`/api/workspaces/file-assets/${assetUrlWithWorkspaceId}/`)
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreImage(assetUrlWithWorkspaceId: string): Promise<any> {
    return this.post(`/api/workspaces/file-assets/${assetUrlWithWorkspaceId}/restore/`, {
      "Content-Type": "application/json",
    })
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteFile(workspaceId: string, assetUrl: string): Promise<any> {
    const lastIndex = assetUrl.lastIndexOf("/");
    const assetId = assetUrl.substring(lastIndex + 1);

    return this.delete(`/api/workspaces/file-assets/${workspaceId}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUserFile(assetUrl: string): Promise<any> {
    const lastIndex = assetUrl.lastIndexOf("/");
    const assetId = assetUrl.substring(lastIndex + 1);

    return this.delete(`/api/users/file-assets/${assetId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
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

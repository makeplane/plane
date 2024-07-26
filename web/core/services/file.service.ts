// services
import axios from "axios";
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// helpers

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

export class FileService extends APIService {
  private cancelSource: any;

  constructor() {
    super(API_BASE_URL);
    this.uploadFile = this.uploadFile.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.restoreImage = this.restoreImage.bind(this);
    this.cancelUpload = this.cancelUpload.bind(this);
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

  async uploadUserFile(file: FormData): Promise<any> {
    return this.post(`/api/users/file-assets/`, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
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

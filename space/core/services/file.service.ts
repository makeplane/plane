import axios from "axios";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

class FileService extends APIService {
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

  getUploadFileFunction(workspaceSlug: string): (file: File) => Promise<string> {
    return async (file: File) => {
      const formData = new FormData();
      formData.append("asset", file);
      formData.append("attributes", JSON.stringify({}));

      const data = await this.uploadFile(workspaceSlug, formData);
      return data.asset;
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
}

const fileService = new FileService();

export default fileService;

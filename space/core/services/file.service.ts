import { API_BASE_URL } from "@plane/constants";
import { TFileEntityInfo, TFileSignedURLResponse } from "@plane/types";
// helpers
import { generateFileUploadPayload, getAssetIdFromUrl, getFileMetaDataForUpload } from "@/helpers/file.helper";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class FileService extends APIService {
  private cancelSource: any;
  fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    this.cancelUpload = this.cancelUpload.bind(this);
    // services
    this.fileUploadService = new FileUploadService();
  }

  private async updateAssetUploadStatus(anchor: string, assetId: string): Promise<void> {
    return this.patch(`/api/public/assets/v2/anchor/${anchor}/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateBulkAssetsUploadStatus(
    anchor: string,
    entityId: string,
    data: {
      asset_ids: string[];
    }
  ): Promise<void> {
    return this.post(`/api/public/assets/v2/anchor/${anchor}/${entityId}/bulk/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadAsset(anchor: string, data: TFileEntityInfo, file: File): Promise<TFileSignedURLResponse> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(`/api/public/assets/v2/anchor/${anchor}/`, {
      ...data,
      ...fileMetaData,
    })
      .then(async (response) => {
        const signedURLResponse: TFileSignedURLResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateAssetUploadStatus(anchor, signedURLResponse.asset_id);
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
    const assetKey = getAssetIdFromUrl(src);
    return this.delete(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/`)
      .then((response) => response?.status)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreNewAsset(workspaceSlug: string, src: string): Promise<void> {
    // remove the last slash and get the asset id
    const assetId = getAssetIdFromUrl(src);
    return this.post(`/api/public/assets/v2/workspaces/${workspaceSlug}/restore/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreOldEditorAsset(workspaceId: string, src: string): Promise<void> {
    const assetKey = getAssetIdFromUrl(src);
    return this.post(`/api/workspaces/file-assets/${workspaceId}/${assetKey}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  cancelUpload() {
    this.cancelSource.cancel("Upload cancelled");
  }
}

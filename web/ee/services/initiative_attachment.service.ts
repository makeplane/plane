import { AxiosRequestConfig } from "axios";
import { TInitiativeAttachment, TInitiativeAttachmentUploadResponse } from "@plane/types";
import { API_BASE_URL  } from "@plane/constants";
import { generateFileUploadPayload, getFileMetaDataForUpload  } from "@plane/utils";
import { APIService } from "@/services/api.service";

import { FileUploadService } from "@/services/file-upload.service";

export class InitiativeAttachmentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateInitiativeAttachmentUploadStatus(
    workspaceSlug: string,
    initiativeId: string,
    assetId: string
  ): Promise<TInitiativeAttachment> {
    return this.patch(
      `/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/${assetId}/`,
      {
        status: "uploaded",
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInitiativeAttachments(workspaceSlug: string, initiativeId: string): Promise<TInitiativeAttachment[]> {
    return this.get(`/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/`)
      .then((response) => response?.data)
      .catch((error) => {
        // Handle error appropriately
        console.error("Error fetching initiative attachments:", error);
        throw error;
      });
  }

  async uploadInitiativeAttachment(
    workspaceSlug: string,
    initiativeId: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TInitiativeAttachment> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(
      `/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/`,
      fileMetaData
    )
      .then(async (response) => {
        const signedURLResponse: TInitiativeAttachmentUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(
          signedURLResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        await this.updateInitiativeAttachmentUploadStatus(workspaceSlug, initiativeId, signedURLResponse.asset_id);
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteInitiativeAttachment(
    workspaceSlug: string,
    initiativeId: string,
    assetId: string
  ): Promise<TInitiativeAttachment> {
    return this.delete(`/api/assets/v2/workspaces/${workspaceSlug}/initiatives/${initiativeId}/attachments/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

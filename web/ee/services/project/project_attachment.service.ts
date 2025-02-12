import { AxiosRequestConfig } from "axios";
// plane types
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "@/helpers/file.helper";
// services
import { TProjectAttachment, TProjectAttachmentUploadResponse } from "@/plane-web/types";
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class ProjectAttachmentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateProjectAttachmentUploadStatus(
    workspaceSlug: string,
    projectId: string,
    attachmentId: string
  ): Promise<void> {
    return this.patch(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/attachments/${attachmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadProjectAttachment(
    workspaceSlug: string,
    projectId: string,
    file: File,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TProjectAttachment> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/attachments/`, fileMetaData)
      .then(async (response) => {
        const signedURLResponse: TProjectAttachmentUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(
          signedURLResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        await this.updateProjectAttachmentUploadStatus(workspaceSlug, projectId, signedURLResponse.asset_id);
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Updated service methods for project attachments
  async getProjectAttachments(workspaceSlug: string, projectId: string): Promise<TProjectAttachment[]> {
    return this.get(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/attachments/`)
      .then((response) => response?.data)
      .catch((error) => {
        // Handle error appropriately
        console.error("Error fetching project attachments:", error);
        throw error;
      });
  }

  async deleteProjectAttachment(
    workspaceSlug: string,
    projectId: string,
    assetId: string
  ): Promise<TProjectAttachment> {
    return this.delete(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/attachments/${assetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

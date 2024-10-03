import { TIssueAttachment, TIssueAttachmentUploadResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "@/helpers/file.helper";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class IssueAttachmentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateIssueAttachmentUploadStatus(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    attachmentId: string
  ): Promise<void> {
    return this.patch(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    file: File
  ): Promise<TIssueAttachment> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments/`,
      fileMetaData
    )
      .then(async (response) => {
        const signedURLResponse: TIssueAttachmentUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(signedURLResponse.upload_data.url, fileUploadPayload);
        await this.updateIssueAttachmentUploadStatus(workspaceSlug, projectId, issueId, signedURLResponse.asset_id);
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueAttachment(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueAttachment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

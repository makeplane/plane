import { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@plane/constants";
// plane types
import { TRequestAttachmentUploadResponse, TCustomerRequestAttachment } from "@plane/types";
// helpers
import { APIService } from "../api.service";
import { FileUploadService } from "../file";
import { generateFileUploadPayload, getFileMetaDataForUpload } from "../file/helper";

export class RequestAttachmentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  private async updateRequestAttachmentUploadStatus(
    workspaceSlug: string,
    requestId: string,
    data: { attachment_ids: string[] }
  ): Promise<void> {
    return this.patch(`/api/assets/v2/workspaces/${workspaceSlug}/customer-requests/${requestId}/attachments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadRequestAttachment(
    workspaceSlug: string,
    file: File,
    requestId?: string,
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<TCustomerRequestAttachment> {
    const fileMetaData = getFileMetaDataForUpload(file);
    return this.post(`/api/assets/v2/workspaces/${workspaceSlug}/customer-requests/attachments/`, fileMetaData, {
      params: { customer_request_id: requestId },
    })
      .then(async (response) => {
        const signedURLResponse: TRequestAttachmentUploadResponse = response?.data;
        const fileUploadPayload = generateFileUploadPayload(signedURLResponse, file);
        await this.fileUploadService.uploadFile(
          signedURLResponse.upload_data.url,
          fileUploadPayload,
          uploadProgressHandler
        );
        if (requestId) {
          await this.updateRequestAttachmentUploadStatus(workspaceSlug, requestId, {
            attachment_ids: [signedURLResponse.asset_id],
          });
        }
        return signedURLResponse.attachment;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRequestAttachments(workspaceSlug: string, requestId: string): Promise<TCustomerRequestAttachment[]> {
    return this.get(`/api/assets/v2/workspaces/${workspaceSlug}/customer-requests/${requestId}/attachments`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRequestAttachment(workspaceSlug: string, attachmentId: string): Promise<void> {
    return this.delete(`/api/assets/v2/workspaces/${workspaceSlug}/customer-requests/attachments/${attachmentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

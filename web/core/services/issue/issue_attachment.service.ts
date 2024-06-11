import { TIssueAttachment } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class IssueAttachmentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async uploadIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    file: FormData
  ): Promise<TIssueAttachment> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/`,
      file,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
      .then((response) => response?.data)
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

  async deleteIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    assetId: string
  ): Promise<TIssueAttachment> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/${assetId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

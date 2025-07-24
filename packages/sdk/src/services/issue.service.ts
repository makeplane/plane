import { APIService } from "@/services/api.service";
// types
import {
  AttachmentResponse,
  ClientOptions,
  ExcludedProps,
  ExIssue,
  ExIssueAttachment,
  IssueSearchResponse,
  ExpandableFields,
  IssueWithExpanded,
  Optional,
  Paginated,
  ExIssueLink,
} from "@/types/types";

export class IssueService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getIssueByIdentifier(
    workspaceSlug: string,
    projectIdentifier: string,
    issueSequence: number
  ): Promise<ExIssue> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/issues/${projectIdentifier}-${issueSequence.toString()}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueByIdentifierWithFields(
    workspaceSlug: string,
    projectIdentifier: string,
    issueSequence: number,
    expand: (keyof ExpandableFields)[]
  ): Promise<IssueWithExpanded<typeof expand>> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/issues/${projectIdentifier}-${issueSequence.toString()}/?expand=${expand.join(",")}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchIssues(
    workspaceSlug: string,
    query: string,
    projectId?: string
  ): Promise<{ issues: IssueSearchResponse[] }> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/issues/search/`, {
      params: {
        search: query,
        project_id: projectId,
        workspace_search: !projectId,
      },
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExIssue>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(slug: string, projectId: string, payload: Omit<Optional<ExIssue>, ExcludedProps>): Promise<ExIssue> {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, issueId: string, payload: Omit<Optional<ExIssue>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, issueId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createLink(slug: string, projectId: string, issueId: string, title: string, url: string) {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/links/`, {
      title: title,
      url: url,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteLink(slug: string, projectId: string, issueId: string, linkId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/links/${linkId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLinks(slug: string, projectId: string, issueId: string): Promise<Paginated<ExIssueLink>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/links/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueAttachmentUrl(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    name: string,
    size: number,
    type: string,
    external_source: string,
    external_id: string
  ): Promise<AttachmentResponse> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/server/`,
      {
        name,
        size,
        type,
        external_source,
        external_id,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        if (error?.response?.status === 409) {
          return {
            ...error.response.data,
            already_exists: true,
          };
        }
        throw error?.response?.data;
      });
  }

  async updateIssueAttachment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    attachmentId: string,
    payload: Omit<Optional<ExIssueAttachment>, ExcludedProps>
  ) {
    return this.patch(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/${attachmentId}/server/`,
      payload
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueWithExternalId(
    workspaceSlug: string,
    projectId: string,
    externalId: string,
    externalSource: string
  ): Promise<ExIssue> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/?external_id=${externalId}&external_source=${externalSource}`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uploadToPresignedUrl(uploadData: AttachmentResponse["upload_data"], file: File): Promise<void> {
    const formData = new FormData();

    Object.entries(uploadData.fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);

    return fetch(uploadData.url, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Upload failed");
      })
      .catch((error) => {
        throw error;
      });
  }

  async uploadAttachment(
    workspaceSlug: string,
    project_id: string,
    issue_id: string,
    file: File,
    name: string,
    size: number,
    options?: {
      type?: string;
      project_id?: string;
      external_id?: string;
      external_source?: string;
    }
  ): Promise<string> {
    // First get the presigned URL
    const uploadResponse = await this.getIssueAttachmentUrl(
      workspaceSlug,
      project_id,
      issue_id,
      name,
      size,
      options?.type ?? file.type,
      options?.external_source ?? "",
      options?.external_id ?? ""
    );

    if (uploadResponse.already_exists) {
      return uploadResponse.asset_id;
    }

    // Then upload the file
    await this.uploadToPresignedUrl(uploadResponse.upload_data, file);

    // Mark the asset as uploaded
    await this.updateIssueAttachment(workspaceSlug, project_id, issue_id, uploadResponse.asset_id, {
      is_uploaded: true,
    });

    // Return the asset ID
    return uploadResponse.asset_id;
  }

  async getIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<ExIssue> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueWithFields(workspaceSlug: string, projectId: string, issueId: string, expand: (keyof ExpandableFields)[]): Promise<IssueWithExpanded<typeof expand>> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/?expand=${expand.join(",")}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueAttachments(workspaceSlug: string, projectId: string, issueId: string): Promise<ExIssueAttachment[]> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-attachments/server/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

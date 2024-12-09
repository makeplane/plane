import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExcludedProps, ExIssueComment, ExIssueLabel, Optional, Paginated } from "@/types/types";

export class IssueCommentService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string, issueId: string): Promise<Paginated<ExIssueLabel>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/comments/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    slug: string,
    projectId: string,
    issueId: string,
    payload: Omit<Optional<ExIssueComment>, ExcludedProps>
  ) {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/comments/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getComment(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string
  ): Promise<ExIssueComment> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueCommentWithExternalId(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    externalId: string,
    externalSource: string
  ): Promise<ExIssueComment> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/comments/?external_id=${externalId}&external_source=${externalSource}`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    slug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    payload: Omit<Optional<ExIssueComment>, ExcludedProps>
  ) {
    return this.patch(
      `/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`,
      payload
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, issueId: string, commentId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/issues/${issueId}/comments/${commentId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

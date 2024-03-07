import { API_BASE_URL } from "helpers/common.helper";
import { APIService } from "services/api.service";
// helpers
// types
import type { TInboxIssue, TIssue, TInboxIssueListResponse } from "@plane/types";

export class InboxIssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string, params = {}): Promise<TInboxIssueListResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, inboxIssueId: string): Promise<TInboxIssue> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/?expand=issue_inbox`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: Partial<TIssue>): Promise<TInboxIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/`, {
      source: "IN_APP",
      issue: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string,
    data: { issue: Partial<TIssue> }
  ): Promise<TInboxIssue> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, inboxIssueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

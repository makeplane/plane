import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { TInboxIssueFilterOptions, TInboxIssueExtendedDetail, TIssue, TInboxDetailedStatus } from "@plane/types";

export class InboxIssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchInboxIssues(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    params?: TInboxIssueFilterOptions | {}
  ): Promise<TInboxIssueExtendedDetail[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/?expand=issue_inbox`,
      {
        params,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchInboxIssueById(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string
  ): Promise<TInboxIssueExtendedDetail> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/?expand=issue_inbox`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createInboxIssue(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    data: {
      source: string;
      issue: Partial<TIssue>;
    }
  ): Promise<TInboxIssueExtendedDetail> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/?expand=issue_inbox`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateInboxIssue(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: { issue: Partial<TIssue> }
  ): Promise<TInboxIssueExtendedDetail> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/?expand=issue_inbox`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeInboxIssue(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateInboxIssueStatus(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: TInboxDetailedStatus
  ): Promise<TInboxIssueExtendedDetail> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/?expand=issue_inbox`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

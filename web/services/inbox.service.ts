import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { IInboxIssue, IInbox, TInboxStatus, IInboxQueryParams } from "@plane/types";

export class InboxService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInboxes(workspaceSlug: string, projectId: string): Promise<IInbox[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInboxById(workspaceSlug: string, projectId: string, inboxId: string): Promise<IInbox> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchInbox(workspaceSlug: string, projectId: string, inboxId: string, data: Partial<IInbox>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInboxIssues(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    params?: IInboxQueryParams
  ): Promise<IInboxIssue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInboxIssueById(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string
  ): Promise<IInboxIssue> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteInboxIssue(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markInboxStatus(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: TInboxStatus
  ): Promise<IInboxIssue> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchInboxIssue(
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: { issue: Partial<IInboxIssue> }
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createInboxIssue(workspaceSlug: string, projectId: string, inboxId: string, data: any): Promise<IInboxIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

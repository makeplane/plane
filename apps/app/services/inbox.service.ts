import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

// types
import type { IInboxIssue, IInbox } from "types";

class InboxServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getInboxes(workspaceSlug: string, projectId: string): Promise<IInbox[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInboxById(workspaceSlug: string, projectId: string, inboxId: string): Promise<IInbox> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInboxIssues(
    workspaceSlug: string,
    projectId: string,
    inboxId: string
  ): Promise<IInboxIssue[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues`
    )
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
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/${inboxIssueId}`
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
    data: any
  ): Promise<IInboxIssue> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/inbox-issues/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackInboxEvent(response?.data, "INBOX_ISSUE_CREATE");
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // async updateInbox(
  //   workspaceSlug: string,
  //   projectId: string,
  //   inboxId: string,
  //   data: IInboxForm
  // ): Promise<any> {
  //   return this.put(
  //     `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}`,
  //     data
  //   )
  //     .then((response) => {
  //       if (trackEvent) trackEventServices.trackInboxEvent(response?.data, "INBOX_UPDATE");
  //       return response?.data;
  //     })
  //     .catch((error) => {
  //       throw error?.response?.data;
  //     });
  // }

  // async patchInbox(
  //   workspaceSlug: string,
  //   projectId: string,
  //   inboxId: string,
  //   data: Partial<IInbox>
  // ): Promise<any> {
  //   return this.patch(
  //     `/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}`,
  //     data
  //   )

  //     .then((response) => {
  //       if (trackEvent) trackEventServices.trackInboxEvent(response?.data, "INBOX_UPDATE");
  //       return response?.data;
  //     })
  //     .catch((error) => {
  //       throw error?.response?.data;
  //     });
  // }

  // async deleteInbox(workspaceSlug: string, projectId: string, inboxId: string): Promise<any> {
  //   return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}`)
  //     .then((response) => {
  //       if (trackEvent) trackEventServices.trackInboxEvent(response?.data, "INBOX_DELETE");
  //       return response?.data;
  //     })
  //     .catch((error) => {
  //       throw error?.response?.data;
  //     });
  // }
}

const inboxServices = new InboxServices();

export default inboxServices;

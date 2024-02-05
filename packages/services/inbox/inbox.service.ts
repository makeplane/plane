import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { TInbox } from "@plane/types";

export class InboxService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchInboxes(workspaceSlug: string, projectId: string): Promise<TInbox[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchInboxById(workspaceSlug: string, projectId: string, inboxId: string): Promise<TInbox> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateInbox(workspaceSlug: string, projectId: string, inboxId: string, data: Partial<TInbox>): Promise<TInbox> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inboxes/${inboxId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

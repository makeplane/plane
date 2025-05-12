/* eslint-disable no-useless-catch */

// plane imports
import { TInboxForm } from "@plane/types";
// services
import { InboxIssueService as CeInboxIssueService } from "@/services/inbox";

export class InboxIssueService extends CeInboxIssueService {
  constructor() {
    super();
  }

  async retrievePublishForm(workspaceSlug: string, projectId: string): Promise<TInboxForm> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePublishForm(workspaceSlug: string, projectId: string, data: Partial<TInboxForm>): Promise<TInboxForm> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-settings/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async regeneratePublishForm(
    workspaceSlug: string,
    projectId: string,
    featureType: string
  ): Promise<{ anchor: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/publish-intake-regenerate/${featureType}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

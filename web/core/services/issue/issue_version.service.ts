// plane types
import { TEditorVersion } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class IssueVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAllVersions(workspaceSlug: string, projectId: string, issueId: string): Promise<TEditorVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchVersionById(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    versionId: string
  ): Promise<TEditorVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

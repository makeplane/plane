// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TPageVersion } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class ProjectPageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAllVersions(workspaceSlug: string, projectId: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchVersionById(
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    versionId: string
  ): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreVersion(workspaceSlug: string, projectId: string, pageId: string, versionId: string): Promise<void> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/versions/${versionId}/restore/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

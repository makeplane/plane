// plane types
import { TPageVersion } from "@plane/types";
// helpers
import { API_BASE_URL  } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class WorkspacePageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAllVersions(workspaceSlug: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchVersionById(workspaceSlug: string, pageId: string, versionId: string): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreVersion(workspaceSlug: string, pageId: string, versionId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/versions/${versionId}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

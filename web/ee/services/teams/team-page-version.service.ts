// plane types
import { TPageVersion } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class TeamPageVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetch all versions of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  async fetchAllVersions(workspaceSlug: string, teamId: string, pageId: string): Promise<TPageVersion[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/versions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch a version of a page for a team
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @param versionId
   * @returns
   */
  async fetchVersionById(
    workspaceSlug: string,
    teamId: string,
    pageId: string,
    versionId: string
  ): Promise<TPageVersion> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/pages/${pageId}/versions/${versionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

// types
import type { IWorkspace, TWorkspacePaginationInfo } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description Fetches all workspaces
   * @returns Promise<TWorkspacePaginationInfo>
   */
  async getWorkspaces(nextPageCursor?: string): Promise<TWorkspacePaginationInfo> {
    return this.get<TWorkspacePaginationInfo>("/api/instances/workspaces/", {
      cursor: nextPageCursor,
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Checks if a slug is available
   * @param slug - string
   * @returns Promise<any>
   */
  async workspaceSlugCheck(slug: string): Promise<any> {
    const params = new URLSearchParams({ slug });
    return this.get(`/api/instances/workspace-slug-check/?${params.toString()}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Creates a new workspace
   * @param data - IWorkspace
   * @returns Promise<IWorkspace>
   */
  async createWorkspace(data: IWorkspace): Promise<IWorkspace> {
    return this.post<IWorkspace, IWorkspace>("/api/instances/workspaces/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

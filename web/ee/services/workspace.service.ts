// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// types
import { TWorkspaceWithProductDetails } from "@/plane-web/types";
// services
import { WorkspaceService as CoreWorkspaceService } from "@/services/workspace.service";

export class WorkspaceService extends CoreWorkspaceService {
  constructor() {
    super(API_BASE_URL);
  }

  async updateViewAccess(workspaceSlug: string, viewId: string, access: EViewAccess) {
    return this.post(`/api/workspaces/${workspaceSlug}/views/${viewId}/access/`, {
      access,
    }).catch((error) => {
      throw error?.response?.data;
    });
  }

  async lockView(workspaceSlug: string, viewId: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/views/${viewId}/lock/`).catch((error) => {
      throw error?.response?.data;
    });
  }

  async unLockView(workspaceSlug: string, viewId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/views/${viewId}/lock/`).catch((error) => {
      throw error?.response?.data;
    });
  }

  async getWorkspacesWithPlanDetails(): Promise<TWorkspaceWithProductDetails[]> {
    return this.get(`/api/payments/website/workspaces/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async searchAcrossWorkspace(workspaceSlug: string, params: { search: string; projectId?: string }) {
    return this.get(`/api/workspaces/${workspaceSlug}/search/`, {
      params,
    }).then((response) => response?.data);
  }
}

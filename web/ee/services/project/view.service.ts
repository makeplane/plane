import { EViewAccess } from "@/constants/views";
import { API_BASE_URL } from "@/helpers/common.helper";
import { ViewService as CoreViewService } from "@/services/view.service";

export class ViewService extends CoreViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async updateViewAccess(workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/access/`, {
      access,
    }).catch((error) => {
      throw error?.response?.data;
    });
  }

  async lockView(workspaceSlug: string, projectId: string, viewId: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch((error) => {
      throw error?.response?.data;
    });
  }

  async unLockView(workspaceSlug: string, projectId: string, viewId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch(
      (error) => {
        throw error?.response?.data;
      }
    );
  }
}

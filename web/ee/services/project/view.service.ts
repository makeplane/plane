import { EViewAccess } from "@plane/constants";
import { TPublishViewSettings } from "@plane/types";
// helpers
import { API_BASE_URL  } from "@plane/constants";
// services
import { ViewService as CoreViewService } from "@/services/view.service";

export class ViewService extends CoreViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async updateViewAccess(workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess): Promise<any> {
    return await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/access/`, {
      access,
    }).catch((error) => {
      throw error?.response?.data;
    });
  }

  async lockView(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch(
      (error) => {
        throw error?.response?.data;
      }
    );
  }

  async unLockView(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return await this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch(
      (error) => {
        throw error?.response?.data;
      }
    );
  }

  async getPublishDetails(workspaceSlug: string, projectId: string, viewId: string) {
    return await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async publishView(workspaceSlug: string, projectId: string, viewId: string, data: TPublishViewSettings) {
    return await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/publish/`, {
      ...data,
      view_props: {
        list: true,
        kanban: true,
        calendar: true,
        gantt: true,
        spreadsheet: true,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePublishedView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) {
    return await this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/publish/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unPublishView(workspaceSlug: string, projectId: string, viewId: string) {
    return await this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

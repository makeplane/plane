import { API_BASE_URL } from "@plane/constants";
import { EViewAccess, TPublishViewSettings } from "@plane/types";
import { ViewService as CoreViewService } from "@/services/view.service";

export class ViewService extends CoreViewService {
  constructor() {
    super(API_BASE_URL);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateViewAccess(workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async lockView(workspaceSlug: string, projectId: string, viewId: string) {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unLockView(workspaceSlug: string, projectId: string, viewId: string) {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPublishDetails(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return Promise.resolve({});
  }

  async publishView(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceSlug: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: TPublishViewSettings
  ): Promise<any> {
    return Promise.resolve();
  }

  async updatePublishedView(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceSlug: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: Partial<TPublishViewSettings>
  ): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unPublishView(workspaceSlug: string, projectId: string, viewId: string): Promise<void> {
    return Promise.resolve();
  }
}

import { EViewAccess } from "@/constants/views";
import { API_BASE_URL } from "@/helpers/common.helper";
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
}

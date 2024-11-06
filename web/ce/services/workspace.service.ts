import { EViewAccess } from "@/constants/views";
import { API_BASE_URL } from "@/helpers/common.helper";
import { WorkspaceService as CoreWorkspaceService } from "@/services/workspace.service";

export class WorkspaceService extends CoreWorkspaceService {
  constructor() {
    super(API_BASE_URL);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateViewAccess(workspaceSlug: string, viewId: string, access: EViewAccess) {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async lockView(workspaceSlug: string, viewId: string) {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unLockView(workspaceSlug: string, viewId: string) {
    return Promise.resolve();
  }
}

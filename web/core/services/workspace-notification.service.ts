/* eslint-disable no-useless-catch */

import type { TNotificationPaginationInfo, INotificationParams } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceNotificationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getUserNotifications(
    workspaceSlug: string,
    params: INotificationParams
  ): Promise<TNotificationPaginationInfo | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/users/notifications`, {
        params,
      });
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}

const workspaceNotificationService = new WorkspaceNotificationService();

export default workspaceNotificationService;

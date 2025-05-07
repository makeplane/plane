/* eslint-disable no-useless-catch */

import { EWorkspaceNotificationTransport } from "@plane/constants";
import type {
    TWorkspaceUserNotification,
} from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceNotificationSettingsService extends APIService {
    constructor() {
        super(API_BASE_URL);
    }

    async fetchNotificationSettings(workspaceSlug: string): Promise<TWorkspaceUserNotification[] | undefined> {
        try {
            const { data } = await this.get(`/api/workspaces/${workspaceSlug}/user-notification-preferences/`);
            return data || undefined;
        } catch (error) {
            throw error;
        }
    }


    async updateNotificationSettings(
        workspaceSlug: string,
        transport: EWorkspaceNotificationTransport,
        payload: Partial<TWorkspaceUserNotification>
    ): Promise<TWorkspaceUserNotification | undefined> {
        try {
            const { data } = await this.patch(
                `/api/workspaces/${workspaceSlug}/user-notification-preferences/${transport}/`,
                payload
            );
            return data || undefined;
        } catch (error) {
            throw error;
        }
    }
}

const workspaceNotificationSettingService = new WorkspaceNotificationSettingsService();

export default workspaceNotificationSettingService;

import { WorkspaceNotificationService } from "@/services/workspace-notification.service";

export class InboxService extends WorkspaceNotificationService {
  async markBulkNotificationsAsRead(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async markBulkNotificationsAsUnread(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async archiveNotificationList(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async unArchiveNotificationList(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async updateNotficationList(
    workspaceSlug: string,
    payload: { notification_ids: string[]; snoozed_till: string | undefined }
  ) {
    await this.patch(`/api/workspaces/${workspaceSlug}/inbox/`, payload);
  }
}

const inboxService = new InboxService();
export default inboxService;

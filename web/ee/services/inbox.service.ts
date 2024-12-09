import { WorkspaceNotificationService } from "@/services/workspace-notification.service";

export class InboxService extends WorkspaceNotificationService {
  async markNotificationGroupRead(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async markNotificationGroupUnRead(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async archiveNotificationGroup(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async unArchiveNotificationGroup(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async updateNotficationGroup(
    workspaceSlug: string,
    payload: { notification_ids: string[]; snoozed_till: string | undefined }
  ) {
    await this.patch(`/api/workspaces/${workspaceSlug}/inbox/`, payload);
  }
}

const inboxService = new InboxService();
export default inboxService;

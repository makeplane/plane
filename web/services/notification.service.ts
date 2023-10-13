// services
import { APIService } from "services/api.service";
// types
import type {
  IUserNotification,
  INotificationParams,
  NotificationCount,
  PaginatedUserNotification,
  IMarkAllAsReadPayload,
} from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class NotificationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getUserNotifications(workspaceSlug: string, params: INotificationParams): Promise<IUserNotification[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserNotificationDetailById(workspaceSlug: string, notificationId: string): Promise<IUserNotification> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsRead(workspaceSlug: string, notificationId: string): Promise<IUserNotification> {
    return this.post(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/read/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsUnread(workspaceSlug: string, notificationId: string): Promise<IUserNotification> {
    return this.delete(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/read/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsArchived(workspaceSlug: string, notificationId: string): Promise<IUserNotification> {
    return this.post(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsUnarchived(workspaceSlug: string, notificationId: string): Promise<IUserNotification> {
    return this.delete(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchUserNotification(
    workspaceSlug: string,
    notificationId: string,
    data: Partial<IUserNotification>
  ): Promise<IUserNotification> {
    return this.patch(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUserNotification(workspaceSlug: string, notificationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subscribeToIssueNotifications(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribe/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueNotificationSubscriptionStatus(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<{
    subscribed: boolean;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribe/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unsubscribeFromIssueNotifications(workspaceSlug: string, projectId: string, issueId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribe/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUnreadNotificationsCount(workspaceSlug: string): Promise<NotificationCount> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications/unread/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getNotifications(url: string): Promise<PaginatedUserNotification> {
    return this.get(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markAllNotificationsAsRead(workspaceSlug: string, payload: IMarkAllAsReadPayload): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/users/notifications/mark-all-read/`, {
      ...payload,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

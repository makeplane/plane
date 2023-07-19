// services
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

// types
import { IUserNotification, INotificationParams } from "types";

class UserNotificationsServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getUserNotifications(
    workspaceSlug: string,
    params: INotificationParams
  ): Promise<IUserNotification[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserNotificationDetailById(
    workspaceSlug: string,
    notificationId: string
  ): Promise<IUserNotification> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsRead(
    workspaceSlug: string,
    notificationId: string
  ): Promise<IUserNotification> {
    return this.post(`/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/read/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsUnread(
    workspaceSlug: string,
    notificationId: string
  ): Promise<IUserNotification> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/read/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsArchived(
    workspaceSlug: string,
    notificationId: string
  ): Promise<IUserNotification> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/archive/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markUserNotificationAsUnarchived(
    workspaceSlug: string,
    notificationId: string
  ): Promise<IUserNotification> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/archive/`
    )
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/users/notifications/${notificationId}/`,
      data
    )
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

  async subscribeToIssueNotifications(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: {
      subscriber: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-subscribers/`,
      data
    )
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
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribe/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unsubscribeFromIssueNotifications(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribe/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUnreadNotificationsCount(workspaceSlug: string): Promise<{
    created_issues: number;
    my_issues: number;
    watching_issues: number;
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/users/notifications/unread/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const userNotificationServices = new UserNotificationsServices();

export default userNotificationServices;

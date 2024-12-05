import { orderBy, uniqBy } from "lodash";
import { runInAction } from "mobx";
//store
import { computedFn } from "mobx-utils";
import { TNotification } from "@plane/types";
import { convertToEpoch } from "@/helpers/date-time.helper";
import { RootStore } from "@/plane-web/store/root.store";
import { INotification } from "@/store/notifications/notification";
import {
  IWorkspaceNotificationStore as IWorkspaceNotificationStoreCore,
  WorkspaceNotificationStore as WorkspaceNotificationStoreCore,
} from "@/store/notifications/workspace-notifications.store";

export type TGroupedNotifications = Record<string, TNotification[]>;

export interface IWorkspaceNotificationStore extends IWorkspaceNotificationStoreCore {
  groupedNotificationsByIssueId: (workspaceId: string) => Record<string, INotification[]>;
  notificationIssueIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  markNotificationGroupRead: (notificationGroup: INotification[], workspaceSlug: string) => Promise<void>;
  markNotificationGroupUnRead: (notificationGroup: INotification[], workspaceSlug: string) => Promise<void>;
  archiveNotificationGroup: (notificationGroup: INotification[], workspaceSlug: string) => Promise<void>;
  unArchiveNotificationGroup: (notificationGroup: INotification[], workspaceSlug: string) => Promise<void>;
  snoozeNotificationGroup: (
    notificationGroup: INotification[],
    workspaceSlug: string,
    snoozeTill: Date
  ) => Promise<void>;
  unSnoozeNotificationGroup: (notificationGroup: INotification[], workspaceSlug: string) => Promise<void>;
  hasInboxIssue: (notificationGroup: INotification[]) => boolean;
}

export class WorkspaceNotificationStore extends WorkspaceNotificationStoreCore implements IWorkspaceNotificationStore {
  constructor(protected store: RootStore) {
    super(store);
  }
  groupedNotificationsByIssueId = computedFn((workspaceId: string) => {
    const filteredNotificationsIds = this.notificationIdsByWorkspaceId(workspaceId);
    if (!filteredNotificationsIds) return {};

    const groupedNotifications: Record<string, INotification[]> = {};

    filteredNotificationsIds.forEach((id) => {
      const entityId = this.notifications[id].entity_identifier;
      if (!entityId) return;
      const existingNotifications = groupedNotifications[entityId] || [];
      groupedNotifications[entityId] = uniqBy([...existingNotifications, this.notifications[id]], "id");
    });

    return groupedNotifications;
  });

  notificationIssueIdsByWorkspaceId = computedFn((workspaceId: string) => {
    const groupedNotifications: Record<string, INotification[]> = this.groupedNotificationsByIssueId(workspaceId);

    const groupedNotificationIssueIds = orderBy(
      Object.keys(groupedNotifications),
      (issueId) => {
        const notifications = groupedNotifications[issueId];
        const latestNotification = orderBy(notifications, (n) => convertToEpoch(n.created_at), "desc")[0];
        return convertToEpoch(latestNotification.created_at);
      },
      "desc"
    );

    return groupedNotificationIssueIds;
  });

  /**
   *
   * @param notificationGroup : INotification[]
   */
  markNotificationGroupRead = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const unreadNotificationGroup = notificationGroup.filter((n) => !n.read_at);
    try {
      Object.values(unreadNotificationGroup).forEach((notification) => {
        if (!notification.read_at) {
          notification.markNotificationAsRead(workspaceSlug);
        }
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> markNotificationGroupRead -> error", error);
      throw error;
    }
  };

  markNotificationGroupUnRead = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const readNotificationsGroup = notificationGroup.filter((n) => n.read_at);
    try {
      Object.values(readNotificationsGroup).forEach((notification) => {
        if (notification.read_at) {
          notification.markNotificationAsUnRead(workspaceSlug);
        }
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> markNotificationGroupRead -> error", error);
      throw error;
    }
  };

  archiveNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      Object.values(notificationGroup).forEach((notification) => {
        notification.archiveNotification(workspaceSlug);
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> archiveNotificationGroup -> error", error);
      throw error;
    }
  };

  unArchiveNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      Object.values(notificationGroup).forEach((notification) => {
        notification.unArchiveNotification(workspaceSlug);
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unArchiveNotificationGroup -> error", error);
      throw error;
    }
  };

  snoozeNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string, snoozeTill: Date) => {
    try {
      Object.values(notificationGroup).forEach((notification) => {
        notification.snoozeNotification(workspaceSlug, snoozeTill);
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unArchiveNotificationGroup -> error", error);
      throw error;
    }
  };

  unSnoozeNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      Object.values(notificationGroup).forEach((notification) => {
        notification.unSnoozeNotification(workspaceSlug);
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unArchiveNotificationGroup -> error", error);
      throw error;
    }
  };

  hasInboxIssue = (notificationGroup: INotification[]) => {
    const inbox_issue = notificationGroup.find((notification) => notification.is_inbox_issue);
    if (inbox_issue) return true;
    return false;
  };
}

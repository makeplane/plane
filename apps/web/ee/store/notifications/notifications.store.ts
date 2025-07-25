import orderBy from "lodash/orderBy";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ENotificationLoader } from "@plane/constants";
import { TNotification } from "@plane/types";
// helpers
import { convertToEpoch } from "@plane/utils";
// services
import inboxService from "@/plane-web/services/inbox.service";
// store
import { RootStore } from "@/plane-web/store/root.store";
import { INotification } from "@/store/notifications/notification";
import {
  IWorkspaceNotificationStore as IWorkspaceNotificationStoreCore,
  WorkspaceNotificationStore as WorkspaceNotificationStoreCore,
} from "@/store/notifications/workspace-notifications.store";

export type TGroupedNotifications = Record<string, TNotification[]>;

export interface IWorkspaceNotificationStore extends IWorkspaceNotificationStoreCore {
  higlightedActivityIds: string[];
  getNotificationsGroupedByIssue: (workspaceId: string) => Record<string, INotification[]>;
  getIssueIdsSortedByLatestNotification: (workspaceId: string) => string[] | undefined;
  markBulkNotificationsAsRead: (notitificationList: INotification[], workspaceSlug: string) => Promise<void>;
  markBulkNotificationsAsUnread: (notitificationList: INotification[], workspaceSlug: string) => Promise<void>;
  archiveNotificationList: (notitificationList: INotification[], workspaceSlug: string) => Promise<void>;
  unArchiveNotificationList: (notitificationList: INotification[], workspaceSlug: string) => Promise<void>;
  snoozeNotificationList: (
    notitificationList: INotification[],
    workspaceSlug: string,
    snoozeUntil: Date
  ) => Promise<void>;
  unSnoozeNotificationList: (notitificationList: INotification[], workspaceSlug: string) => Promise<void>;
  containsInboxIssue: (notitificationList: INotification[]) => boolean;
  setHighlightedActivityIds: (activityIds: string[]) => void;
}

export class WorkspaceNotificationStore extends WorkspaceNotificationStoreCore implements IWorkspaceNotificationStore {
  higlightedActivityIds: string[] = [];

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {
      higlightedActivityIds: observable,
      setHighlightedActivityIds: action,
    });
  }

  getNotificationsGroupedByIssue = computedFn((workspaceId: string) => {
    const notificationIds = this.notificationIdsByWorkspaceId(workspaceId);
    if (!notificationIds) return {};

    return notificationIds.reduce<Record<string, INotification[]>>((groupedNotifications, id) => {
      const notification = this.notifications[id];
      const entityId = notification.entity_identifier;

      if (!entityId) return groupedNotifications;

      if (!groupedNotifications[entityId]) {
        groupedNotifications[entityId] = [];
      }

      groupedNotifications[entityId].push(notification);

      return groupedNotifications;
    }, {});
  });

  /**
   * @description Sorts issues by latest notificaion and returns the sorted ids.
   * @param workspaceId: string
   * @returns string[]
   */
  getIssueIdsSortedByLatestNotification = computedFn((workspaceId: string) => {
    const groupedNotifications: Record<string, INotification[]> = this.getNotificationsGroupedByIssue(workspaceId);

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

  markBulkNotificationsAsRead = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const unreadNotificationGroup = notificationGroup.filter((n) => !n.read_at);
    if (unreadNotificationGroup.length === 0) return;
    try {
      this.loader = ENotificationLoader.MUTATION_LOADER;

      const notification_ids: string[] = unreadNotificationGroup.map((n) => n.id);

      await inboxService.markBulkNotificationsAsRead(workspaceSlug, {
        notification_ids,
      });

      runInAction(() => {
        this.setUnreadNotificationsCount("decrement", notification_ids.length);
        Object.values(unreadNotificationGroup).forEach((notification) => {
          notification.mutateNotification({ read_at: new Date().toISOString() });
        });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> markNotificationGroupRead -> error", error);
      throw error;
    } finally {
      this.loader = undefined;
    }
  };

  markBulkNotificationsAsUnread = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const readNotificationGroup = notificationGroup.filter((n) => n.read_at);
    if (readNotificationGroup.length === 0) return;
    try {
      this.loader = ENotificationLoader.MUTATION_LOADER;

      const notification_ids: string[] = readNotificationGroup.map((n) => n.id);

      await inboxService.markBulkNotificationsAsUnread(workspaceSlug, {
        notification_ids,
      });

      runInAction(() => {
        this.setUnreadNotificationsCount("increment", notification_ids.length);
        Object.values(readNotificationGroup).forEach((notification) => {
          notification.mutateNotification({ read_at: undefined });
        });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> markNotificationGroupUnRead -> error", error);
      throw error;
    } finally {
      this.loader = undefined;
    }
  };

  archiveNotificationList = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup.map((n) => n.id);

      await inboxService.archiveNotificationList(workspaceSlug, { notification_ids });

      Object.values(notificationGroup).forEach((notification) => {
        notification.mutateNotification({ archived_at: new Date().toISOString() });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> archiveNotificationGroup -> error", error);
      throw error;
    }
  };

  unArchiveNotificationList = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup.map((n) => n.id);

      await inboxService.unArchiveNotificationList(workspaceSlug, { notification_ids });

      Object.values(notificationGroup).forEach((notification) => {
        notification.mutateNotification({ archived_at: undefined });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unArchiveNotificationGroup -> error", error);
      throw error;
    }
  };

  snoozeNotificationList = async (notificationGroup: INotification[], workspaceSlug: string, snoozeUntil: Date) => {
    try {
      const notification_ids: string[] = notificationGroup.map((n) => n.id);

      await inboxService.updateNotficationList(workspaceSlug, {
        notification_ids,
        snoozed_till: snoozeUntil.toISOString(),
      });

      runInAction(() => {
        Object.values(notificationGroup).forEach((notification) => {
          notification.mutateNotification({ snoozed_till: snoozeUntil.toISOString() });
        });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> snoozeNotificationGroup -> error", error);
      throw error;
    }
  };

  unSnoozeNotificationList = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup.map((n) => n.id);

      await inboxService.updateNotficationList(workspaceSlug, {
        notification_ids,
        snoozed_till: undefined,
      });

      runInAction(() => {
        Object.values(notificationGroup).forEach((notification) => {
          notification.mutateNotification({ snoozed_till: undefined });
        });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unSnoozeNotificationGroup -> error", error);
      throw error;
    }
  };

  containsInboxIssue = (notificationGroup: INotification[]) => {
    const inbox_issue = notificationGroup.find((notification) => notification.is_inbox_issue);
    if (inbox_issue) return true;
    return false;
  };

  setHighlightedActivityIds = (activityIds: string[]) => {
    this.higlightedActivityIds = activityIds;
  };
}

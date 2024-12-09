import orderBy from "lodash/orderBy";
import uniqBy from "lodash/uniqBy";
import { runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TNotification } from "@plane/types";
import { ENotificationLoader } from "@/constants/notification";
//helpers
import { convertToEpoch } from "@/helpers/date-time.helper";
//services
import inboxService from "@/plane-web/services/inbox.service";
//store
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

  /**
   * @description Sorts issues by latest notificaion and returns the sorted ids.
   * @param workspaceId: string
   * @returns string[]
   */
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
   * @description Marks a group of notificaitons read
   * @param notificationGroup : INotification[]
   */
  markNotificationGroupRead = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const unreadNotificationGroup = notificationGroup.filter((n) => !n.read_at);
    if (unreadNotificationGroup.length === 0) return;
    try {
      this.loader = ENotificationLoader.MUTATION_LOADER;

      const notification_ids: string[] = unreadNotificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.markNotificationGroupRead(workspaceSlug, {
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

  /**
   * @description Marks group of notifications unread
   * @param notificationGroup : INotification[]
   * @param workspaceSlug : string
   */
  markNotificationGroupUnRead = async (notificationGroup: INotification[], workspaceSlug: string) => {
    const readNotificationGroup = notificationGroup.filter((n) => n.read_at);
    if (readNotificationGroup.length === 0) return;
    try {
      this.loader = ENotificationLoader.MUTATION_LOADER;

      const notification_ids: string[] = readNotificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.markNotificationGroupUnRead(workspaceSlug, {
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

  /**
   * @description Archives group of notifications
   * @param notificationGroup : INotification[]
   * @param workspaceSlug : string
   */
  archiveNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.archiveNotificationGroup(workspaceSlug, { notification_ids });

      Object.values(notificationGroup).forEach((notification) => {
        notification.mutateNotification({ archived_at: new Date().toISOString() });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> archiveNotificationGroup -> error", error);
      throw error;
    }
  };

  /**
   * @description Un archives group of notifications
   * @param notificationGroup: INotification[]
   * @param workspaceSlug: string
   */
  unArchiveNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.unArchiveNotificationGroup(workspaceSlug, { notification_ids });

      Object.values(notificationGroup).forEach((notification) => {
        notification.mutateNotification({ archived_at: undefined });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> unArchiveNotificationGroup -> error", error);
      throw error;
    }
  };

  /**
   * @description Snoozes group of notifications unitl the provided date and time
   * @param notificationGroup : INotification[]
   * @param workspaceSlug : string
   * @param snoozed_till : Date
   */
  snoozeNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string, snoozeTill: Date) => {
    try {
      const notification_ids: string[] = notificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.updateNotficationGroup(workspaceSlug, {
        notification_ids,
        snoozed_till: snoozeTill.toISOString(),
      });

      runInAction(() => {
        Object.values(notificationGroup).forEach((notification) => {
          notification.mutateNotification({ snoozed_till: snoozeTill.toISOString() });
        });
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> snoozeNotificationGroup -> error", error);
      throw error;
    }
  };

  /**
   * @description Un Snoozes group of notifications unitl the provided date and time
   * @param notificationGroup : INotification[]
   * @param workspaceSlug : string
   * @param snoozed_till : Date
   */
  unSnoozeNotificationGroup = async (notificationGroup: INotification[], workspaceSlug: string) => {
    try {
      const notification_ids: string[] = notificationGroup
        .filter((n): n is INotification & { id: string } => !!n.id)
        .map((n) => n.id);

      await inboxService.updateNotficationGroup(workspaceSlug, {
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

  /**
   * Checks if notification group has an inbox issue
   * @param notificationGroup : INotification[]
   * @returns boolean
   */
  hasInboxIssue = (notificationGroup: INotification[]) => {
    const inbox_issue = notificationGroup.find((notification) => notification.is_inbox_issue);
    if (inbox_issue) return true;
    return false;
  };
}

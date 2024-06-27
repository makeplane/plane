import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TNotification, TNotificationPaginatedInfo, TNotificationPaginatedInfoQueryParams } from "@plane/types";
// constants
import { ENotificationLoader, ENotificationTab, TNotificationTab } from "@/constants/notification";
// services
import workspaceNotificationService from "@/services/workspace-notification.service";
// store
import { Notification, INotification } from "@/store/notifications/notification.store";
import { CoreRootStore } from "@/store/root.store";

type TNotificationLoader = ENotificationLoader | undefined;

export interface IWorkspaceNotificationStore {
  // observables
  loader: TNotificationLoader;
  notifications: Record<string, INotification>; // notification_id -> notification
  currentNotificationTab: TNotificationTab;
  paginationInfo: Omit<TNotificationPaginatedInfo, "results"> | undefined;
  // computed
  notificationIds: string[] | undefined;
  // computed functions
  notificationIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  // helper actions
  mutateNotifications: (notifications: TNotification[]) => void;
  // actions
  setCurrentNotificationTab: (tab: TNotificationTab) => void;
  getNotifications: (
    workspaceSlug: string,
    loader?: TNotificationLoader
  ) => Promise<TNotificationPaginatedInfo | undefined>;
  getNotificationById: (workspaceId: string, notificationId: string) => Promise<TNotification | undefined>;
  deleteNotificationById: (workspaceId: string, notificationId: string) => Promise<void>;
}

export class WorkspaceNotificationStore implements IWorkspaceNotificationStore {
  // constants
  paginatedCount = 30;
  // observables
  loader: TNotificationLoader = undefined;
  notifications: Record<string, INotification> = {};
  currentNotificationTab: TNotificationTab = ENotificationTab.ALL;
  paginationInfo: Omit<TNotificationPaginatedInfo, "results"> | undefined = undefined;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      notifications: observable,
      currentNotificationTab: observable.ref,
      paginationInfo: observable,
      // computed
      notificationIds: computed,
      // actions
      getNotifications: action,
      getNotificationById: action,
      deleteNotificationById: action,
    });
  }

  // computed
  /**
   * @description get notification ids
   */
  get notificationIds() {
    return !isEmpty(this.notifications) ? Object.keys(this.notifications) : undefined;
  }

  // computed functions
  /**
   * @description get notification ids by workspace id
   * @param { string } workspaceId
   */
  notificationIdsByWorkspaceId = computedFn((workspaceId: string) => {
    if (!workspaceId || isEmpty(this.notifications)) return undefined;
    const workspaceNotificationIds = Object.values(this.notifications || {})
      .filter((n) => n.workspace === workspaceId)
      .map((n) => n.id) as string[];
    return workspaceNotificationIds ?? undefined;
  });

  // helper functions
  /**
   * @description mutate and validate current existing and new notifications
   * @param { TNotification[] } notifications
   */
  mutateNotifications = (notifications: TNotification[]) => {
    (notifications || []).forEach((notification) => {
      if (!notification.id) return;
      if (this.notifications[notification.id]) {
        this.notifications[notification.id].mutateNotification(notification);
      } else {
        set(this.notifications, notification.id, new Notification(this.store, notification));
      }
    });
  };

  /**
   * @description generate notification query params
   * @returns { object }
   */
  generateNotificationQueryParams = (): TNotificationPaginatedInfoQueryParams => ({
    type: undefined,
    snoozed: false,
    archived: false,
    read: undefined,
    per_page: this.paginatedCount,
    cursor: this.paginationInfo ? this.paginationInfo?.next_cursor : `${this.paginatedCount}:0:0`,
  });

  // actions
  /**
   * @description set notification tab
   * @returns { void }
   */
  setCurrentNotificationTab = (tab: TNotificationTab): void => {
    set(this, "currentNotificationTab", tab);
  };

  /**
   * @description get all workspace notification
   * @param { string } workspaceSlug,
   * @param { TNotificationLoader } loader,
   * @returns { TNotification | undefined }
   */
  getNotifications = async (
    workspaceSlug: string,
    loader: TNotificationLoader = ENotificationLoader.INIT_LOADER
  ): Promise<TNotificationPaginatedInfo | undefined> => {
    this.loader = loader;
    try {
      const queryParams = this.generateNotificationQueryParams();
      const notificationResponse = await workspaceNotificationService.fetchNotifications(workspaceSlug, queryParams);
      if (notificationResponse) {
        const { results, ...paginationInfo } = notificationResponse;
        runInAction(() => {
          if (results) {
            this.mutateNotifications(results);
          }
          set(this, "paginationInfo", paginationInfo);
        });
      }
      return notificationResponse;
    } catch (error) {
      console.error("WorkspaceNotificationStore -> getNotifications -> error", error);
      throw error;
    } finally {
      this.loader = undefined;
    }
  };

  /**
   * @description get notification by id
   * @param { string } workspaceId,
   * @param { string } notificationId,
   * @returns { TNotification | undefined }
   */
  getNotificationById = async (workspaceId: string, notificationId: string): Promise<TNotification | undefined> => {
    try {
      const notification = await workspaceNotificationService.fetchNotificationById(workspaceId, notificationId);
      if (notification) {
        runInAction(() => {
          this.mutateNotifications([notification]);
        });
      }
      return notification;
    } catch (error) {
      console.error("WorkspaceNotificationStore -> getNotificationById -> error", error);
      throw error;
    }
  };

  /**
   * @description delete notification by id
   * @param { string } workspaceId,
   * @param { string } notificationId,
   * @returns { void }
   */
  deleteNotificationById = async (workspaceId: string, notificationId: string): Promise<void> => {
    try {
      await workspaceNotificationService.deleteNotificationById(workspaceId, notificationId);
      runInAction(() => notificationId && unset(this.notifications, [notificationId]));
    } catch (error) {
      console.error("WorkspaceNotificationStore -> deleteNotificationById -> error", error);
      throw error;
    }
  };
}

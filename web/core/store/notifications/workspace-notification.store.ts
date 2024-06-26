import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TNotification, TNotificationPaginationInfo } from "@plane/types";
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
  paginationInfo: Omit<TNotificationPaginationInfo, "results"> | undefined;
  // computed
  notificationIds: string[] | undefined;
  // computed functions
  notificationIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  // actions
  setCurrentNotificationTab: (tab: TNotificationTab) => void;
  getNotifications: (
    workspaceSlug: string,
    loader?: TNotificationLoader
  ) => Promise<TNotificationPaginationInfo | undefined>;
}

export class WorkspaceNotificationStore implements IWorkspaceNotificationStore {
  // constants
  paginatedCount = 30;
  // observables
  loader: TNotificationLoader = undefined;
  notifications: Record<string, INotification> = {};
  currentNotificationTab: TNotificationTab = ENotificationTab.ALL;
  paginationInfo: Omit<TNotificationPaginationInfo, "results"> | undefined = undefined;

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
    });
  }

  // helper functions
  mutateWorkspaceNotification = (notifications: TNotification[]) => {
    (notifications || []).forEach((notification) => {
      if (!notification.id) return;
      if (this.notifications[notification.id]) {
        this.notifications[notification.id].updateNotification(notification);
      } else {
        set(this.notifications, notification.id, new Notification(this.store, notification));
      }
    });
  };

  generateNotificationQueryParams = () => ({
    type: undefined,
    snoozed: false,
    archived: false,
    read: undefined,
    per_page: this.paginatedCount,
    cursor: this.paginationInfo ? this.paginationInfo?.next_cursor : `${this.paginatedCount}:0:0`,
  });

  // computed
  /**
   * @description get workspace notification ids
   */
  get notificationIds() {
    return !isEmpty(this.notifications) ? Object.keys(this.notifications) : undefined;
  }

  // computed functions
  notificationIdsByWorkspaceId = computedFn((workspaceId: string) => {
    if (!workspaceId || isEmpty(this.notifications)) return undefined;
    const workspaceNotificationIds = Object.values(this.notifications || {})
      .filter((n) => n.workspace === workspaceId)
      .map((n) => n.id) as string[];
    return workspaceNotificationIds ?? undefined;
  });

  // actions
  /**
   * @description set notification tab
   * @returns { void }
   */
  setCurrentNotificationTab = (tab: TNotificationTab) => (this.currentNotificationTab = tab);

  /**
   * @description get all workspace notification
   * @returns { void }
   */
  getNotifications = async (
    workspaceSlug: string,
    loader: TNotificationLoader = ENotificationLoader.INIT_LOADER
  ): Promise<TNotificationPaginationInfo | undefined> => {
    this.loader = loader;
    try {
      const queryParams = this.generateNotificationQueryParams();
      const notificationResponse = await workspaceNotificationService.getUserNotifications(workspaceSlug, queryParams);

      if (notificationResponse) {
        const { results, ...paginationInfo } = notificationResponse;
        runInAction(() => {
          if (results) {
            this.mutateWorkspaceNotification(results);
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
}

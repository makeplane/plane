import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import {
  TNotification,
  TNotificationFilter,
  TNotificationPaginatedInfo,
  TNotificationPaginatedInfoQueryParams,
  TUnreadNotificationsCount,
} from "@plane/types";
// constants
import {
  ENotificationLoader,
  ENotificationQueryParamType,
  ENotificationTab,
  TNotificationTab,
} from "@/constants/notification";
// services
import workspaceNotificationService from "@/services/workspace-notification.service";
// store
import { Notification, INotification } from "@/store/notifications/notification";
import { CoreRootStore } from "@/store/root.store";

type TNotificationLoader = ENotificationLoader | undefined;
type TNotificationQueryParamType = ENotificationQueryParamType;

export interface IWorkspaceNotificationStore {
  // observables
  loader: TNotificationLoader;
  unreadNotificationsCount: TUnreadNotificationsCount | undefined;
  notifications: Record<string, INotification>; // notification_id -> notification
  currentNotificationTab: TNotificationTab;
  paginationInfo: Omit<TNotificationPaginatedInfo, "results"> | undefined;
  filters: TNotificationFilter;
  // computed
  totalUnreadNotificationsCount: number;
  // computed functions
  notificationIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  // helper actions
  mutateNotifications: (notifications: TNotification[]) => void;
  updateFilters: <T extends keyof TNotificationFilter>(key: T, value: TNotificationFilter[T]) => void;
  updateBulkFilters: (filters: Partial<TNotificationFilter>) => void;
  // actions
  setCurrentNotificationTab: (tab: TNotificationTab) => void;
  getUnreadNotificationsCount: (workspaceSlug: string) => Promise<TUnreadNotificationsCount | undefined>;
  getNotifications: (
    workspaceSlug: string,
    loader?: TNotificationLoader,
    queryCursorType?: TNotificationQueryParamType
  ) => Promise<TNotificationPaginatedInfo | undefined>;
  markAllNotificationsAsRead: (workspaceId: string) => Promise<void>;
}

export class WorkspaceNotificationStore implements IWorkspaceNotificationStore {
  // constants
  paginatedCount = 30;
  // observables
  loader: TNotificationLoader = undefined;
  unreadNotificationsCount: TUnreadNotificationsCount | undefined = undefined;
  notifications: Record<string, INotification> = {};
  currentNotificationTab: TNotificationTab = ENotificationTab.ALL;
  paginationInfo: Omit<TNotificationPaginatedInfo, "results"> | undefined = undefined;
  filters: TNotificationFilter = {
    type: {
      assigned: false,
      created: false,
      subscribed: false,
    },
    snoozed: false,
    archived: false,
    read: false,
  };

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      unreadNotificationsCount: observable.ref,
      notifications: observable,
      currentNotificationTab: observable.ref,
      paginationInfo: observable,
      filters: observable,
      // computed
      totalUnreadNotificationsCount: computed,
      // helper actions
      setCurrentNotificationTab: action,
      mutateNotifications: action,
      updateFilters: action,
      updateBulkFilters: action,
      // actions
      getUnreadNotificationsCount: action,
      getNotifications: action,
      markAllNotificationsAsRead: action,
    });
  }

  // computed
  get totalUnreadNotificationsCount() {
    let count: number = 0;
    if (!this.unreadNotificationsCount) return count;

    Object.values(this.unreadNotificationsCount).forEach((value) => {
      count += value || 0;
    });
    return count;
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
      .filter((n) => {
        if (!this.filters.archived && !this.filters.snoozed) {
          if (n.archived_at) {
            return false;
          } else if (n.snoozed_till) {
            return false;
          } else {
            return true;
          }
        } else {
          if (this.filters.snoozed) {
            return n.snoozed_till ? true : false;
          } else if (this.filters.archived) {
            return n.archived_at ? true : false;
          } else {
            return true;
          }
        }
      })
      // .filter((n) => (this.filters.read ? (n.read_at ? true : false) : n.read_at ? false : true))
      .map((n) => n.id) as string[];
    return workspaceNotificationIds;
  });

  // helper functions
  /**
   * @description generate notification query params
   * @returns { object }
   */
  generateNotificationQueryParams = (paramType: TNotificationQueryParamType): TNotificationPaginatedInfoQueryParams => {
    const queryParamsType =
      Object.entries(this.filters.type)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(",") || undefined;

    const currentPage = this.paginationInfo ? Number(this.paginationInfo?.prev_cursor?.split(":")[1] || 0) + 1 : 0;

    const queryCursorNext =
      paramType === ENotificationQueryParamType.INIT
        ? `${this.paginatedCount}:0:0`
        : paramType === ENotificationQueryParamType.CURRENT
          ? `${this.paginatedCount}:${currentPage}:0`
          : paramType === ENotificationQueryParamType.NEXT && this.paginationInfo
            ? this.paginationInfo?.next_cursor
            : `${this.paginatedCount}:${currentPage}:0`;

    const queryParams: TNotificationPaginatedInfoQueryParams = {
      type: queryParamsType,
      snoozed: this.filters.snoozed || false,
      archived: this.filters.archived || false,
      read: undefined,
      per_page: this.paginatedCount,
      cursor: queryCursorNext,
    };

    // NOTE: This validation is required to show all the read and unread notifications in a single place it may change in future.
    queryParams.read = this.filters.read === true ? false : undefined;

    return queryParams;
  };

  // helper actions
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
   * @description update filters
   * @param { T extends keyof TNotificationFilter } key
   * @param { TNotificationFilter[T] } value
   */
  updateFilters = <T extends keyof TNotificationFilter>(key: T, value: TNotificationFilter[T]) => {
    set(this.filters, key, value);
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    set(this, "notifications", {});
    this.getNotifications(workspaceSlug, ENotificationLoader.INIT_LOADER, ENotificationQueryParamType.INIT);
  };

  /**
   * @description update bulk filters
   * @param { Partial<TNotificationFilter> } filters
   */
  updateBulkFilters = (filters: Partial<TNotificationFilter>) => {
    Object.entries(filters).forEach(([key, value]) => {
      set(this.filters, key, value);
    });

    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    set(this, "notifications", {});
    this.getNotifications(workspaceSlug, ENotificationLoader.INIT_LOADER, ENotificationQueryParamType.INIT);
  };

  // actions
  /**
   * @description set notification tab
   * @returns { void }
   */
  setCurrentNotificationTab = (tab: TNotificationTab): void => {
    set(this, "currentNotificationTab", tab);
  };

  /**
   * @description get unread notifications count
   * @param { string } workspaceSlug,
   * @param { TNotificationQueryParamType } queryCursorType,
   * @returns { number | undefined }
   */
  getUnreadNotificationsCount = async (workspaceSlug: string): Promise<TUnreadNotificationsCount | undefined> => {
    try {
      const unreadNotificationCount = await workspaceNotificationService.fetchUnreadNotificationsCount(workspaceSlug);
      if (unreadNotificationCount)
        runInAction(() => {
          set(this, "unreadNotificationsCount", unreadNotificationCount);
        });
      return unreadNotificationCount || undefined;
    } catch (error) {
      console.error("WorkspaceNotificationStore -> getUnreadNotificationsCount -> error", error);
      throw error;
    }
  };

  /**
   * @description get all workspace notification
   * @param { string } workspaceSlug,
   * @param { TNotificationLoader } loader,
   * @returns { TNotification | undefined }
   */
  getNotifications = async (
    workspaceSlug: string,
    loader: TNotificationLoader = ENotificationLoader.INIT_LOADER,
    queryParamType: TNotificationQueryParamType = ENotificationQueryParamType.INIT
  ): Promise<TNotificationPaginatedInfo | undefined> => {
    this.loader = loader;
    try {
      const queryParams = this.generateNotificationQueryParams(queryParamType);
      await this.getUnreadNotificationsCount(workspaceSlug);
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
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description mark all notifications as read
   * @param { string } workspaceSlug,
   * @returns { void }
   */
  markAllNotificationsAsRead = async (workspaceSlug: string): Promise<void> => {
    try {
      this.loader = ENotificationLoader.MARK_ALL_AS_READY;
      const queryParams = this.generateNotificationQueryParams(ENotificationQueryParamType.INIT);
      const params = {
        type: queryParams.type,
        snoozed: queryParams.snoozed,
        archived: queryParams.archived,
        read: queryParams.read,
      };
      await workspaceNotificationService.markAllNotificationsAsRead(workspaceSlug, params);
      runInAction(() => {
        Object.values(this.notifications).forEach((notification) =>
          notification.mutateNotification({
            read_at: new Date().toUTCString(),
          })
        );
      });
    } catch (error) {
      console.error("WorkspaceNotificationStore -> markAllNotificationsAsRead -> error", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };
}

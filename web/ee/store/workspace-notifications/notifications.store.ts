import { orderBy, groupBy } from "lodash";
import { action, makeObservable, observable, runInAction, set } from "mobx";
//store
import { computedFn } from "mobx-utils";
import { TNotification, TNotificationPaginatedInfo } from "@plane/types";
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
import { convertToEpoch } from "@/helpers/date-time.helper";
import {RootStore} from '@/plane-web/store/root.store'
import workspaceNotificationService from "@/services/workspace-notification.service";
import { IWorkspaceNotificationStore as IWorkspaceNotificationStoreCore , TNotificationLoader, TNotificationQueryParamType, WorkspaceNotificationStore as WorkspaceNotificationStoreCore } from "@/store/notifications/workspace-notifications.store";

export type TGroupedNotifications = Record<string,TNotification[]>

export interface IWorkspaceNotificationStore extends IWorkspaceNotificationStoreCore {
  // observales
  groupedNotifications: Record<string, TNotification[]>;
  // actions
  groupNotificationsById: (notifications: TNotification[]) => void;
  notificationIssueIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
}

export class WorkspaceNotificationStore extends WorkspaceNotificationStoreCore implements IWorkspaceNotificationStore {
  // observables
  groupedNotifications: Record<string, TNotification[]> = {};

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {
      groupedNotifications: observable,
      groupNotificationsById: action,
    });
  }

  // actions
  /**
   * @description Execute when notifications are fetched
   * @param { INotification[] } notifications
   */
  groupNotificationsById = action((notifications: TNotification[]) => {
    this.groupedNotifications = groupBy(notifications, (n) => n.data?.issue?.id);
  });

  notificationIssueIdsByWorkspaceId = computedFn((workspaceId: string)=>{
    if(!workspaceId || Object.keys(this.groupedNotifications).length === 0) return undefined;

    const groupedNotificationIssueIds = orderBy(
      Object.keys(this.groupedNotifications),
      (issueId) => {
        const notifications = this.groupedNotifications[issueId];
        const latestNotification = orderBy(notifications,(n)=>convertToEpoch(n.created_at),'desc')[0];
        return convertToEpoch(latestNotification.created_at)
      },
      'desc'
    )

    return groupedNotificationIssueIds;
  })


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
            this.groupNotificationsById(results)
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
}



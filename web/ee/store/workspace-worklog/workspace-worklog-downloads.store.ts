/* eslint-disable no-useless-catch */

import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// helpers
import { convertToEpoch  } from "@plane/utils";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/plane-web/constants/workspace-worklog";
// plane web services
import worklogService from "@/plane-web/services/workspace-worklog.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { IWorklogDownload, WorklogDownload } from "@/plane-web/store/workspace-worklog";
// plane web types
import {
  TDefaultPaginatedInfo,
  TWorklog,
  TWorklogDownload,
  TWorklogDownloadPaginatedInfo,
  TWorklogFilterQueryParams,
  TWorklogQueryParams,
} from "@/plane-web/types/";

type TWorklogLoader = EWorklogDownloadLoader | undefined;
type TWorklogQueryParamType = EWorklogDownloadQueryParamType;

export interface IWorkspaceWorklogDownloadStore {
  // constants
  perPage: number;
  // observables
  loader: TWorklogLoader;
  paginationInfo: TDefaultPaginatedInfo | undefined;
  worklogDownloads: Record<string, IWorklogDownload>;
  currentPaginatedKey: string | undefined;
  paginatedWorklogDownloadIds: Record<string, string[]>;
  // computed functions
  worklogDownloadIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  orderedWorklogDownloads: (workspaceId: string) => IWorklogDownload[];
  // helper functions
  mutateWorklogDownloads: (worklogDownloads: TWorklogDownload[]) => void;
  // helper actions
  setCurrentPaginatedKey: (key: string | undefined) => void;
  getPreviousWorklogDownloads: (workspaceSlug: string) => Promise<void>;
  getNextWorklogDownloads: (workspaceSlug: string) => Promise<void>;
  // actions
  getWorkspaceWorklogDownloads: (
    workspaceSlug: string,
    loader?: EWorklogDownloadLoader,
    paramType?: TWorklogQueryParamType
  ) => Promise<TWorklogDownloadPaginatedInfo | undefined>;
  createWorklogDownload: (workspaceSlug: string, payload: Partial<TWorklog>) => Promise<TWorklogDownload | undefined>;
}

export class WorkspaceWorklogDownloadStore implements IWorkspaceWorklogDownloadStore {
  // constants
  perPage = 10;
  // observables
  loader: TWorklogLoader = undefined;
  paginationInfo: Omit<TWorklogDownloadPaginatedInfo, "results"> | undefined = undefined;
  worklogDownloads: Record<string, IWorklogDownload> = {};
  currentPaginatedKey: string | undefined = undefined;
  paginatedWorklogDownloadIds: Record<string, string[]> = {};

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      paginationInfo: observable,
      worklogDownloads: observable,
      currentPaginatedKey: observable.ref,
      // actions
      getWorkspaceWorklogDownloads: action,
      createWorklogDownload: action,
    });
  }

  orderedWorklogDownloads = computedFn((workspaceId: string) =>
    orderBy(Object.values(this.worklogDownloads || []), (download) => convertToEpoch(download.created_at), [
      "desc",
    ]).filter((download) => download.workspace === workspaceId)
  );

  // computed functions
  /**
   * @description getting the worklogIds by workspaceId
   * @returns { string[] | undefined }
   */
  worklogDownloadIdsByWorkspaceId = computedFn((workspaceId: string) => {
    if (!workspaceId || isEmpty(this.worklogDownloads)) return undefined;
    const workspaceWorklogDownloads = orderBy(
      Object.values(this.worklogDownloads || []),
      (download) => convertToEpoch(download.created_at),
      ["desc"]
    );
    const worklogsIds = workspaceWorklogDownloads
      .filter((download) => download.workspace === workspaceId)
      .map((download) => download.id) as string[];
    return worklogsIds;
  });

  // helper functions
  /**
   * @description generate notification query params
   * @returns { object }
   */
  generateNotificationQueryParams = (paramType: TWorklogQueryParamType): TWorklogQueryParams => {
    let queryCursorNext: string = `${this.perPage}:${0}:0`;
    switch (paramType) {
      case EWorklogDownloadQueryParamType.INIT:
        queryCursorNext = `${this.perPage}:${0}:0`;
        break;
      case EWorklogDownloadQueryParamType.CURRENT:
        queryCursorNext = this.currentPaginatedKey || `${this.perPage}:${0}:0`;
        break;
      case EWorklogDownloadQueryParamType.NEXT:
        queryCursorNext = this.paginationInfo?.next_cursor || `${this.perPage}:${0}:0`;
        break;
      case EWorklogDownloadQueryParamType.PREV:
        queryCursorNext = this.paginationInfo?.prev_cursor || `${this.perPage}:${0}:0`;
        break;
      default:
        break;
    }

    const queryParams: TWorklogQueryParams = {
      per_page: this.perPage,
      cursor: queryCursorNext,
    };

    return queryParams;
  };

  /**
   * @description mutate and validate current existing and new worklogs
   * @param { TWorklogDownload[] } worklogDownloads
   */
  mutateWorklogDownloads = (worklogDownloads: TWorklogDownload[]) => {
    (worklogDownloads || []).forEach((downloadLog) => {
      if (!downloadLog.id) return;
      if (this.worklogDownloads[downloadLog.id]) {
        this.worklogDownloads[downloadLog.id].mutateDownloadWorklog(downloadLog);
      } else {
        set(this.worklogDownloads, downloadLog.id, new WorklogDownload(this.store, downloadLog));
      }
    });
  };

  // helper actions
  /**
   * @description set current paginated key
   * @param { string | undefined } key
   */
  setCurrentPaginatedKey = (key: string | undefined) => set(this, "currentPaginatedKey", key);

  /**
   * @description get previous worklog downloads
   * @param { string } workspaceSlug
   * @returns { void }
   */
  getPreviousWorklogDownloads = async (workspaceSlug: string): Promise<void> => {
    try {
      set(this, "worklogDownloads", {});
      await this.getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.PAGINATION_LOADER,
        EWorklogDownloadQueryParamType.PREV
      );
    } catch (error) {
      console.error("worklog downloads -> getPreviousWorklogDownloads -> error", error);
      throw error;
    }
  };

  /**
   * @description get next worklog downloads
   * @param { string } workspaceSlug
   * @returns { void }
   */
  getNextWorklogDownloads = async (workspaceSlug: string): Promise<void> => {
    try {
      set(this, "worklogDownloads", {});
      await this.getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.PAGINATION_LOADER,
        EWorklogDownloadQueryParamType.NEXT
      );
    } catch (error) {
      console.error("worklog downloads -> getNextWorklogDownloads -> error", error);
      throw error;
    }
  };

  // actions
  /**
   * @description fetch worklogs for a workspace
   * @param { string } workspaceSlug
   * @param { TWorklogLoader } loader
   * @returns { Promise<TWorklogDownloadPaginatedInfo | undefined> }
   */
  getWorkspaceWorklogDownloads = async (
    workspaceSlug: string,
    loader: TWorklogLoader = EWorklogDownloadLoader.INIT_LOADER,
    paramType: TWorklogQueryParamType = EWorklogDownloadQueryParamType.INIT
  ): Promise<TWorklogDownloadPaginatedInfo | undefined> => {
    try {
      this.loader = loader;
      const queryParams = this.generateNotificationQueryParams(paramType);
      const workspaceWorklogsResponse = await worklogService.fetchWorkspaceWorklogDownloads(workspaceSlug, queryParams);
      if (workspaceWorklogsResponse) {
        const { results, ...paginationInfo } = workspaceWorklogsResponse;
        runInAction(() => {
          if (results) {
            this.mutateWorklogDownloads(results);
          }
          set(this, "paginationInfo", paginationInfo);
          this.setCurrentPaginatedKey(queryParams.cursor);
          update(this, "paginatedWorklogDownloadIds", (prev) => {
            if (results && queryParams.cursor) {
              const workspaceWorklogDownloadIds = results.map((downloadLog) => downloadLog.id);
              return { ...prev, [queryParams.cursor]: workspaceWorklogDownloadIds };
            } else {
              return prev;
            }
          });
        });
      }
      return workspaceWorklogsResponse;
    } catch (error) {
      console.error("worklog downloads -> getWorkspaceWorklogDownloads -> error", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description fetch worklog downloads for a workspace
   * @param { string } workspaceSlug
   * @param { Partial<TWorklogDownload> } payload
   * @returns { Promise<TWorklogDownload | undefined> }
   */
  createWorklogDownload = async (
    workspaceSlug: string,
    payload: Partial<TWorklogDownload>
  ): Promise<TWorklogDownload | undefined> => {
    try {
      const filterQueryParams = Object.keys(this.store.workspaceWorklogs.filters).reduce(
        (acc: TWorklogFilterQueryParams, key) => {
          const filterKey = key as keyof TWorklogFilterQueryParams;
          const filterValue = this.store.workspaceWorklogs.filters[filterKey];
          if (filterValue && filterValue.length > 0) {
            acc[filterKey] = filterValue.join(",");
          }
          return acc;
        },
        {}
      );

      const worklogResponse = await worklogService.createWorklogDownload(workspaceSlug, payload, filterQueryParams);
      if (worklogResponse) {
        this.mutateWorklogDownloads([worklogResponse]);
      }
      return worklogResponse;
    } catch (error) {
      console.error("worklog downloads -> createWorklogDownload -> error", error);
      throw error;
    }
  };
}

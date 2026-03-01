/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { isEmpty, orderBy, set, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// helpers
import { convertToEpoch } from "@plane/utils";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/constants/workspace-worklog";
// plane web services
import worklogService from "@/services/workspace-worklog.service";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
import type { IWorklogDownload } from "./worklog-download";
import { WorklogDownload } from "./worklog-download";
// plane web types
import type {
  TDefaultPaginatedInfo,
  TWorklog,
  TWorklogDownload,
  TWorklogDownloadPaginatedInfo,
  TWorklogFilterQueryParams,
  TWorklogQueryParams,
} from "@/types";

type TWorklogLoader = EWorklogDownloadLoader | undefined;
type TWorklogQueryParamType = EWorklogDownloadQueryParamType;

export interface IWorklogDownloadStore {
  // constants
  perPage: number;
  // observables
  loader: TWorklogLoader;
  paginationInfo: TDefaultPaginatedInfo | undefined;
  worklogDownloads: Record<string, IWorklogDownload>;
  currentPaginatedKey: string | undefined;
  paginatedWorklogDownloadIds: Record<string, string[]>;
  currentProjectId: string | undefined;
  // computed functions
  worklogDownloadIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  orderedWorklogDownloads: (workspaceId: string) => IWorklogDownload[];
  // helper functions
  mutateWorklogDownloads: (worklogDownloads: TWorklogDownload[]) => void;
  // helper actions
  setCurrentPaginatedKey: (key: string | undefined) => void;
  resetState: (loader?: TWorklogLoader) => void;
  getPreviousWorklogDownloads: (workspaceSlug: string, projectId?: string) => Promise<void>;
  getNextWorklogDownloads: (workspaceSlug: string, projectId?: string) => Promise<void>;
  // actions
  getWorkspaceWorklogDownloads: (
    workspaceSlug: string,
    loader?: EWorklogDownloadLoader,
    paramType?: TWorklogQueryParamType,
    projectId?: string
  ) => Promise<TWorklogDownloadPaginatedInfo | undefined>;
  createWorklogDownload: (workspaceSlug: string, payload: Partial<TWorklog>) => Promise<TWorklogDownload | undefined>;
}

export class WorklogDownloadStore implements IWorklogDownloadStore {
  // constants
  perPage = 10;
  // observables
  loader: TWorklogLoader = undefined;
  paginationInfo: Omit<TWorklogDownloadPaginatedInfo, "results"> | undefined = undefined;
  worklogDownloads: Record<string, IWorklogDownload> = {};
  currentPaginatedKey: string | undefined = undefined;
  paginatedWorklogDownloadIds: Record<string, string[]> = {};
  currentProjectId: string | undefined = undefined;
  // disposers for reactions
  private disposers: (() => void)[] = [];

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      paginationInfo: observable,
      worklogDownloads: observable,
      currentPaginatedKey: observable.ref,
      currentProjectId: observable.ref,
      resetState: action,
      // actions
      getWorkspaceWorklogDownloads: action,
      createWorklogDownload: action,
    });
  }

  /**
   * Reset store state
   * @param { TWorklogLoader } loader
   */
  resetState = (loader: TWorklogLoader = undefined) => {
    runInAction(() => {
      this.loader = loader;
      this.paginationInfo = undefined;
      set(this, "worklogDownloads", {});
      this.setCurrentPaginatedKey(undefined);
      set(this, "paginatedWorklogDownloadIds", {});
    });
  };

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
   * @param { string | undefined } projectId
   * @returns { void }
   */
  getPreviousWorklogDownloads = async (workspaceSlug: string, projectId?: string): Promise<void> => {
    try {
      set(this, "worklogDownloads", {});
      await this.getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.PAGINATION_LOADER,
        EWorklogDownloadQueryParamType.PREV,
        projectId
      );
    } catch (error) {
      console.error("worklog downloads -> getPreviousWorklogDownloads -> error", error);
      throw error;
    }
  };

  /**
   * @description get next worklog downloads
   * @param { string } workspaceSlug
   * @param { string | undefined } projectId
   * @returns { void }
   */
  getNextWorklogDownloads = async (workspaceSlug: string, projectId?: string): Promise<void> => {
    try {
      set(this, "worklogDownloads", {});
      await this.getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.PAGINATION_LOADER,
        EWorklogDownloadQueryParamType.NEXT,
        projectId
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
   * @param { string | undefined } projectId
   * @returns { Promise<TWorklogDownloadPaginatedInfo | undefined> }
   */
  getWorkspaceWorklogDownloads = async (
    workspaceSlug: string,
    loader: TWorklogLoader = EWorklogDownloadLoader.INIT_LOADER,
    paramType: TWorklogQueryParamType = EWorklogDownloadQueryParamType.INIT,
    projectId: string | undefined = undefined
  ): Promise<TWorklogDownloadPaginatedInfo | undefined> => {
    try {
      this.loader = loader;
      const queryParams = this.generateNotificationQueryParams(paramType);
      // Use project API if projectId is provided, otherwise use workspace API
      const workspaceWorklogsResponse = projectId
        ? await worklogService.fetchProjectWorklogDownloads(workspaceSlug, projectId, queryParams)
        : await worklogService.fetchWorkspaceWorklogDownloads(workspaceSlug, queryParams);

      if (workspaceWorklogsResponse) {
        const { results, ...paginationInfo } = workspaceWorklogsResponse;
        runInAction(() => {
          if (results) {
            this.mutateWorklogDownloads(results);
          }
          set(this, "paginationInfo", paginationInfo);
          this.setCurrentPaginatedKey(queryParams.cursor);
          update(this, "paginatedWorklogDownloadIds", (prev: Record<string, string[]>) => {
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

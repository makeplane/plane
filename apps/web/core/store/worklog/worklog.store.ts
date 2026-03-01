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

import { update, unset, set, orderBy, isEmpty } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { convertToEpoch } from "@plane/utils";
// plane web constants
import { EWorklogLoader, EWorklogQueryParamType } from "@/constants/workspace-worklog";
// plane web services
import worklogService from "@/services/workspace-worklog.service";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
import type { IWorklog } from "./worklog";
import { Worklog } from "./worklog";
// plane web types
import type {
  TDefaultPaginatedInfo,
  TWorklog,
  TWorklogFilter,
  TWorklogFilterQueryParams,
  TWorklogIssueTotalCount,
  TWorklogPaginatedInfo,
  TWorklogQueryParams,
} from "@/types";

type TWorklogLoader = EWorklogLoader | undefined;
type TWorklogQueryParamType = EWorklogQueryParamType;

export interface IWorklogStore {
  // constants
  perPage: number;
  // observables
  loader: TWorklogLoader;
  paginationInfo: TDefaultPaginatedInfo | undefined;
  worklogs: Record<string, IWorklog>; // worklogId -> IWorklog
  filters: TWorklogFilter;
  currentPaginatedKey: string | undefined;
  paginatedWorklogIds: Record<string, string[]>;
  issueWorklogTotalMinutes: Record<string, number>; // issuesId -> totalWorklogMinutes
  // computed functions
  isFeatureFlagEnabled: boolean;
  isWorklogsEnabledByProjectId: (projectId: string) => boolean;
  worklogIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  worklogIdsByIssueId: (workspaceId: string, issueId: string) => string[] | undefined;
  worklogById: (worklogId: string) => IWorklog | undefined;
  // helper functions
  mutateWorklogs: (worklogs: TWorklog[]) => void;
  // helper actions
  updateFilters: <T extends keyof TWorklogFilter>(workspaceSlug: string, key: T, value: string | string[]) => void;
  setCurrentPaginatedKey: (key: string | undefined) => void;
  resetState: (projectId: string | undefined, loader?: TWorklogLoader) => void;
  getPreviousWorklogs: (workspaceSlug: string, projectId?: string) => Promise<void>;
  getNextWorklogs: (workspaceSlug: string, projectId?: string) => Promise<void>;
  // actions
  getWorklogs: (
    workspaceSlug: string,
    loader?: EWorklogLoader,
    paramType?: TWorklogQueryParamType,
    projectId?: string
  ) => Promise<TWorklogPaginatedInfo | undefined>;
  getWorklogsByIssueId: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loader?: EWorklogLoader
  ) => Promise<TWorklog[] | undefined>;
  getIssueWorklogTotalMinutes: (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ) => Promise<TWorklogIssueTotalCount | undefined>;
  createWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: Partial<TWorklog>
  ) => Promise<TWorklog | undefined>;
  deleteWorklogById: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
}

export class WorklogStore implements IWorklogStore {
  // constants
  perPage = 10;
  // observables
  loader: TWorklogLoader = undefined;
  paginationInfo: Omit<TWorklogPaginatedInfo, "results"> | undefined = undefined;
  worklogs: Record<string, IWorklog> = {};
  filters: TWorklogFilter = {
    created_at: [],
    logged_by: [],
    project: [],
  };
  currentPaginatedKey: string | undefined = undefined;
  paginatedWorklogIds: Record<string, string[]> = {};
  issueWorklogTotalMinutes: Record<string, number> = {};

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      paginationInfo: observable,
      worklogs: observable,
      filters: observable,
      currentPaginatedKey: observable.ref,
      paginatedWorklogIds: observable,
      issueWorklogTotalMinutes: observable,
      // computed
      isFeatureFlagEnabled: computed,
      // helper actions
      updateFilters: action,
      setCurrentPaginatedKey: action,
      resetState: action,
      // actions
      getWorklogs: action,
      getWorklogsByIssueId: action,
      getIssueWorklogTotalMinutes: action,
      createWorklog: action,
      deleteWorklogById: action,
    });
  }

  /**
   * Reset store state when projectId changes
   * @param { string | undefined } projectId
   * @param { TWorklogLoader } loader
   */
  resetState = (projectId: string | undefined, loader: TWorklogLoader = undefined) => {
    runInAction(() => {
      this.loader = loader;
      this.paginationInfo = undefined;
      set(this, "worklogs", {});
      this.setCurrentPaginatedKey(undefined);
      set(this, "paginatedWorklogIds", {});

      Object.keys(this.filters).forEach((key) => {
        if (key === "project") set(this.filters, key, projectId ? [projectId] : []);
        else set(this.filters, key, []);
      });
    });
  };

  // computed
  /**
   * @description validating is worklogs feature flag is enabled or not
   * @returns { boolean }
   */
  get isFeatureFlagEnabled(): boolean {
    const workspaceSlug = this.store.router.workspaceSlug;
    if (!workspaceSlug) return false;
    return this.store.featureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS.ISSUE_WORKLOG] || false;
  }

  // computed functions
  /**
   * @description validating is worklogs is enabled or not in the project level
   * @param { string } projectId
   * @returns { boolean }
   */
  isWorklogsEnabledByProjectId = computedFn((projectId: string) => {
    const projectFeatures = this.store.projectDetails.getProjectFeatures(projectId);
    return projectFeatures?.is_time_tracking_enabled && this.isFeatureFlagEnabled ? true : false;
  });

  /**
   * @description getting the worklogIds by workspaceId
   * @param { string } workspaceId
   * @returns { string[] | undefined }
   */
  worklogIdsByWorkspaceId = computedFn((workspaceId: string) => {
    if (!workspaceId || isEmpty(this.worklogs)) return undefined;
    const workspaceWorklogs = orderBy(Object.values(this.worklogs || []), (w) => convertToEpoch(w.created_at), [
      "desc",
    ]);
    const worklogsIds = workspaceWorklogs
      .filter((log) => log.workspace_id === workspaceId)
      .map((log) => log.id) as string[];
    return worklogsIds;
  });

  /**
   * @description getting the worklogIds by workspaceId and issueId
   * @param { string } workspaceId
   * @param { string } projectId
   * @returns { string[] | undefined }
   */
  worklogIdsByIssueId = computedFn((workspaceId: string, issueId: string) => {
    if (!workspaceId || !issueId || !this.worklogs) return undefined;
    if (isEmpty(this.worklogs)) return [];
    const workspaceWorklogs = orderBy(Object.values(this.worklogs || []), (w) => convertToEpoch(w.created_at), [
      "desc",
    ]);
    const worklogsIds = workspaceWorklogs
      .filter((log) => log.workspace_id === workspaceId && log.issue_detail?.id === issueId)
      .map((log) => log.id) as string[];
    return worklogsIds;
  });

  /**
   * @description getting the worklog by id
   * @param { string } worklogId
   * @returns { IWorklog | undefined }
   */
  worklogById = computedFn((worklogId: string) => this.worklogs[worklogId] || undefined);

  // helper functions
  /**
   * @description generate notification query params
   * @param { TWorklogQueryParamType } paramType
   * @param { string | undefined } projectId
   * @returns { object }
   */
  generateNotificationQueryParams = (paramType: TWorklogQueryParamType, projectId?: string): TWorklogQueryParams => {
    let queryCursorNext: string = `${this.perPage}:${0}:0`;
    switch (paramType) {
      case EWorklogQueryParamType.INIT:
        queryCursorNext = `${this.perPage}:${0}:0`;
        break;
      case EWorklogQueryParamType.CURRENT:
        queryCursorNext = this.currentPaginatedKey || `${this.perPage}:${0}:0`;
        break;
      case EWorklogQueryParamType.NEXT:
        queryCursorNext = this.paginationInfo?.next_cursor || `${this.perPage}:${0}:0`;
        break;
      case EWorklogQueryParamType.PREV:
        queryCursorNext = this.paginationInfo?.prev_cursor || `${this.perPage}:${0}:0`;
        break;
      default:
        break;
    }

    const filterQueryParams = Object.keys(this.filters).reduce((acc: TWorklogFilterQueryParams, key) => {
      const filterKey = key as keyof TWorklogFilterQueryParams;
      // Skip project filter when projectId is present (project is already in API endpoint)
      if (projectId && filterKey === "project") {
        return acc;
      }
      const filterValue = this.filters[filterKey];
      if (filterValue && filterValue.length > 0) {
        acc[filterKey] = filterValue.join(",");
      }
      return acc;
    }, {});

    const queryParams: TWorklogQueryParams = {
      per_page: this.perPage,
      cursor: queryCursorNext,
      ...filterQueryParams,
    };

    return queryParams;
  };

  /**
   * @description mutate and validate current existing and new worklogs
   * @param { TWorklog[] } worklogs
   */
  mutateWorklogs = (worklogs: TWorklog[]) => {
    (worklogs || []).forEach((worklog) => {
      if (!worklog.id) return;
      if (this.worklogs[worklog.id]) {
        this.worklogs[worklog.id].mutateWorklog(worklog);
      } else {
        set(this.worklogs, worklog.id, new Worklog(this.store, worklog));
      }
    });
  };

  // helper actions
  /**
   * @description update filters
   * @param { string } workspaceSlug
   * @param { T extends keyof TWorklogFilter } key
   * @param { string | string[]} value
   */
  updateFilters = <T extends keyof TWorklogFilter>(workspaceSlug: string, key: T, value: string | string[]) => {
    if (!workspaceSlug) return;
    set(this.filters, key, value);

    set(this, "paginatedWorklogIds", {});
    set(this, "worklogs", {});
    this.setCurrentPaginatedKey(undefined);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.getWorklogs(workspaceSlug, EWorklogLoader.WORKSPACE_PAGINATION_LOADER, EWorklogQueryParamType.INIT);
  };

  /**
   * @description set current paginated key
   * @param { string | undefined } key
   */
  setCurrentPaginatedKey = (key: string | undefined) => set(this, "currentPaginatedKey", key);

  /**
   * @description get previous worklogs
   * @param { string } workspaceSlug
   * @param { string | undefined } projectId
   * @returns { void }
   */
  getPreviousWorklogs = async (workspaceSlug: string, projectId?: string): Promise<void> => {
    try {
      set(this, "worklogs", {});
      await this.getWorklogs(
        workspaceSlug,
        EWorklogLoader.WORKSPACE_PAGINATION_LOADER,
        EWorklogQueryParamType.PREV,
        projectId
      );
    } catch (error) {
      console.error("worklog -> getPreviousWorklogs -> error", error);
      throw error;
    }
  };

  /**
   * @description get next worklogs
   * @param { string } workspaceSlug
   * @param { string | undefined } projectId
   * @returns { void }
   */
  getNextWorklogs = async (workspaceSlug: string, projectId?: string): Promise<void> => {
    try {
      set(this, "worklogs", {});
      await this.getWorklogs(
        workspaceSlug,
        EWorklogLoader.WORKSPACE_PAGINATION_LOADER,
        EWorklogQueryParamType.NEXT,
        projectId
      );
    } catch (error) {
      console.error("worklog -> getNextWorklogs -> error", error);
      throw error;
    }
  };

  // actions
  /**
   * @description fetch worklogs for a workspace
   * @param { string } workspaceSlug
   * @param { TWorklogLoader } loader
   * @param { string | undefined } projectId
   * @returns { Promise<TWorklogPaginatedInfo | undefined> }
   */
  getWorklogs = async (
    workspaceSlug: string,
    loader: TWorklogLoader = EWorklogLoader.WORKSPACE_INIT_LOADER,
    paramType: TWorklogQueryParamType = EWorklogQueryParamType.INIT,
    projectId: string | undefined = undefined
  ): Promise<TWorklogPaginatedInfo | undefined> => {
    try {
      this.loader = loader;
      const queryParams = this.generateNotificationQueryParams(paramType, projectId);

      // Use project API if projectId is provided, otherwise use workspace API
      const worklogsResponse = projectId
        ? await worklogService.fetchProjectWorklogs(workspaceSlug, projectId, queryParams)
        : await worklogService.fetchWorkspaceWorklogs(workspaceSlug, queryParams);

      if (worklogsResponse) {
        const { results, ...paginationInfo } = worklogsResponse;

        runInAction(() => {
          if (results) {
            this.mutateWorklogs(results);
          }
          set(this, "paginationInfo", paginationInfo);
          this.setCurrentPaginatedKey(queryParams.cursor);
          update(this, "paginatedWorklogIds", (prev: Record<string, string[]>) => {
            if (results && queryParams.cursor) {
              const workspaceWorklogIds = results.map((log) => log.id);
              return { ...prev, [queryParams.cursor]: workspaceWorklogIds };
            } else {
              return prev;
            }
          });
        });
      }
      return worklogsResponse;
    } catch (error) {
      console.error("worklog -> getWorklogs -> error", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description fetch worklogs for a workspace
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { TWorklogLoader } loader
   * @returns { Promise<TWorklog[] | undefined> }
   */
  getWorklogsByIssueId = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loader: TWorklogLoader = EWorklogLoader.ISSUE_INIT_LOADER
  ): Promise<TWorklog[] | undefined> => {
    try {
      this.loader = loader;
      const issueWorklogsResponse = await worklogService.fetchWorklogsByIssueId(workspaceSlug, projectId, issueId);
      if (issueWorklogsResponse) {
        runInAction(() => {
          this.mutateWorklogs(issueWorklogsResponse);
        });
      }
      return issueWorklogsResponse;
    } catch (error) {
      console.error("worklog -> getWorklogsByIssueId -> error", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description fetch worklogs for a workspace
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @returns { Promise<void> }
   */
  getIssueWorklogTotalMinutes = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TWorklogIssueTotalCount | undefined> => {
    try {
      const issueWorklogTotalMinutes = await worklogService.fetchWorklogCountByIssueId(
        workspaceSlug,
        projectId,
        issueId
      );
      if (issueWorklogTotalMinutes) {
        runInAction(() => {
          set(this.issueWorklogTotalMinutes, issueId, issueWorklogTotalMinutes.total_worklog || 0);
        });
      }
      return issueWorklogTotalMinutes;
    } catch (error) {
      console.error("worklog -> getIssueWorklogTotalMinutes -> error", error);
      throw error;
    }
  };

  /**
   * @description fetch worklogs for a workspace
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { Partial<TWorklog> } payload
   * @returns { Promise<TWorklog | undefined> }
   */
  createWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: Partial<TWorklog>
  ): Promise<TWorklog | undefined> => {
    try {
      const worklogResponse = await worklogService.createWorklog(workspaceSlug, projectId, issueId, payload);
      if (worklogResponse) {
        runInAction(() => {
          this.mutateWorklogs([worklogResponse]);
          set(
            this.issueWorklogTotalMinutes,
            issueId,
            (this.issueWorklogTotalMinutes[issueId] || 0) + ((worklogResponse && worklogResponse?.duration) || 0)
          );
        });
      }
      return worklogResponse;
    } catch (error) {
      console.error("worklog -> createWorklog -> error", error);
      throw error;
    }
  };

  /**
   * @description delete worklog by id
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { string } worklogId
   */
  deleteWorklogById = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void> => {
    const worklog = this.worklogs[worklogId];
    if (!worklog) return;

    try {
      runInAction(() => unset(this.worklogs, worklogId));
      await worklogService.deleteWorklogById(workspaceSlug, projectId, issueId, worklogId);
      if (worklog?.duration && worklog?.duration > 0) {
        runInAction(() => {
          set(
            this.issueWorklogTotalMinutes,
            issueId,
            (this.issueWorklogTotalMinutes[issueId] || 0) - (worklog.duration || 0)
          );
        });
      }
    } catch (error) {
      console.error("worklog -> deleteWorklogById -> error", error);
      runInAction(() => set(this.worklogs, worklogId, worklog));
      throw error;
    }
  };
}

import { update, unset, set, orderBy, isEmpty } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { convertToEpoch } from "@plane/utils";
// plane web constants
import { EWorklogLoader, EWorklogQueryParamType } from "@/plane-web/constants/workspace-worklog";
// plane web services
import worklogService from "@/plane-web/services/workspace-worklog.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { IWorklog, Worklog } from "@/plane-web/store/workspace-worklog";
// plane web types
import {
  TDefaultPaginatedInfo,
  TWorklog,
  TWorklogFilter,
  TWorklogFilterQueryParams,
  TWorklogIssueTotalCount,
  TWorklogPaginatedInfo,
  TWorklogQueryParams,
} from "@/plane-web/types";

type TWorklogLoader = EWorklogLoader | undefined;
type TWorklogQueryParamType = EWorklogQueryParamType;

export interface IWorkspaceWorklogStore {
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
  getPreviousWorklogs: (workspaceSlug: string) => Promise<void>;
  getNextWorklogs: (workspaceSlug: string) => Promise<void>;
  // actions
  getWorkspaceWorklogs: (
    workspaceSlug: string,
    loader?: EWorklogLoader,
    paramType?: TWorklogQueryParamType
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

export class WorkspaceWorklogStore implements IWorkspaceWorklogStore {
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
      // actions
      getWorkspaceWorklogs: action,
      getWorklogsByIssueId: action,
      getIssueWorklogTotalMinutes: action,
      createWorklog: action,
      deleteWorklogById: action,
    });
  }

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
   * @returns { object }
   */
  generateNotificationQueryParams = (paramType: TWorklogQueryParamType): TWorklogQueryParams => {
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
    this.getWorkspaceWorklogs(workspaceSlug, EWorklogLoader.WORKSPACE_PAGINATION_LOADER, EWorklogQueryParamType.INIT);
  };

  /**
   * @description set current paginated key
   * @param { string | undefined } key
   */
  setCurrentPaginatedKey = (key: string | undefined) => set(this, "currentPaginatedKey", key);

  /**
   * @description get previous worklogs
   * @param { string } workspaceSlug
   * @returns { void }
   */
  getPreviousWorklogs = async (workspaceSlug: string): Promise<void> => {
    try {
      set(this, "worklogs", {});
      await this.getWorkspaceWorklogs(
        workspaceSlug,
        EWorklogLoader.WORKSPACE_PAGINATION_LOADER,
        EWorklogQueryParamType.PREV
      );
    } catch (error) {
      console.error("worklog -> getPreviousWorklogs -> error", error);
      throw error;
    }
  };

  /**
   * @description get next worklogs
   * @param { string } workspaceSlug
   * @returns { void }
   */
  getNextWorklogs = async (workspaceSlug: string): Promise<void> => {
    try {
      set(this, "worklogs", {});
      await this.getWorkspaceWorklogs(
        workspaceSlug,
        EWorklogLoader.WORKSPACE_PAGINATION_LOADER,
        EWorklogQueryParamType.NEXT
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
   * @returns { Promise<TWorklogPaginatedInfo | undefined> }
   */
  getWorkspaceWorklogs = async (
    workspaceSlug: string,
    loader: TWorklogLoader = EWorklogLoader.WORKSPACE_INIT_LOADER,
    paramType: TWorklogQueryParamType = EWorklogQueryParamType.INIT
  ): Promise<TWorklogPaginatedInfo | undefined> => {
    try {
      this.loader = loader;
      const queryParams = this.generateNotificationQueryParams(paramType);
      const workspaceWorklogsResponse = await worklogService.fetchWorkspaceWorklogs(workspaceSlug, queryParams);
      if (workspaceWorklogsResponse) {
        const { results, ...paginationInfo } = workspaceWorklogsResponse;

        runInAction(() => {
          if (results) {
            this.mutateWorklogs(results);
          }
          set(this, "paginationInfo", paginationInfo);
          this.setCurrentPaginatedKey(queryParams.cursor);
          update(this, "paginatedWorklogIds", (prev) => {
            if (results && queryParams.cursor) {
              const workspaceWorklogIds = results.map((log) => log.id);
              return { ...prev, [queryParams.cursor]: workspaceWorklogIds };
            } else {
              return prev;
            }
          });
        });
      }
      return workspaceWorklogsResponse;
    } catch (error) {
      console.error("worklog -> getWorkspaceWorklogs -> error", error);
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

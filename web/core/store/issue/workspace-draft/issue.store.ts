import set from "lodash/set";
import unset from "lodash/unset";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TIssue, TIssuesResponse } from "@plane/types";
// helpers
import { getCurrentDateTimeInISO } from "@/helpers/date-time.helper";
// services
import workspaceDraftService from "@/services/issue/workspace_draft.service";
import { IIssueDetail } from "../issue-details/root.store";

export type TLoader =
  | "init-loader"
  | "mutation"
  | "pagination"
  | "loaded"
  | "create"
  | "update"
  | "delete"
  | "move"
  | undefined;

export enum EDraftIssuePaginationType {
  INIT = "INIT",
  NEXT = "NEXT",
  PREV = "PREV",
  CURRENT = "CURRENT",
}

export type TDraftIssuePaginationType = EDraftIssuePaginationType;

export type TNotificationQueryParams = {
  cursor: string;
};

export type TPaginationInfo<T> = {
  next_cursor: string | undefined;
  prev_cursor: string | undefined;
  next_page_results: boolean | undefined;
  prev_page_results: boolean | undefined;
  total_pages: number | undefined;
  extra_stats: string | undefined;
  count: number | undefined; // current paginated results count
  total_count: number | undefined; // total available results count
  results: T[] | undefined;
  grouped_by: string | undefined;
  sub_grouped_by: string | undefined;
};

export interface IWorkspaceDraftIssues {
  // observables
  issuesMap: Record<string, TIssue>;
  paginationInfo: Omit<TPaginationInfo<TIssue>, "results"> | undefined;
  loader: TLoader;
  // computed actions
  getIssueById: (issueId: string) => TIssue | undefined;
  // helper actions
  addIssue: (issues: TIssue[]) => void;
  mutateIssue: (issueId: string, data: Partial<TIssue>) => void;
  removeIssue: (issueId: string) => void;
  // actions
  fetchIssues: (workspaceSlug: string, loadType: TLoader) => Promise<TIssuesResponse | undefined>;
  createIssue: (workspaceSlug: string, payload: Partial<TIssue>) => Promise<TIssue | undefined>;
  updateIssue: (workspaceSlug: string, issueId: string, payload: Partial<TIssue>) => Promise<TIssue | undefined>;
  deleteIssue: (workspaceSlug: string, issueId: string) => Promise<void>;
  moveIssue: (workspaceSlug: string, issueId: string, payload: Partial<TIssue>) => Promise<void>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  changeModulesInIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => Promise<void>;
}

export class WorkspaceDraftIssues implements IWorkspaceDraftIssues {
  // local constants
  paginatedCount = 100;
  // root store
  rootIssueDetailStore: IIssueDetail;
  // observables
  paginationInfo: Omit<TPaginationInfo<TIssue>, "results"> | undefined = undefined;
  loader: TLoader = undefined;
  issuesMap: Record<string, TIssue> = {};

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      issuesMap: observable,
      loader: observable.ref,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      deleteIssue: action,
      moveIssue: action,
      addIssueToCycle: action,
      changeModulesInIssue: action,
    });
    this.rootIssueDetailStore = rootStore;
  }

  // helper actions
  addIssue = (issues: TIssue[]) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.issuesMap[issue.id]) set(this.issuesMap, issue.id, issue);
        else update(this.issuesMap, issue.id, (prevIssue) => ({ ...prevIssue, ...issue }));
      });
    });
  };

  getIssueById = computedFn((issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return undefined;
    return this.issuesMap[issueId];
  });

  mutateIssue = (issueId: string, issue: Partial<TIssue>) => {
    if (!issue || !issueId || !this.issuesMap[issueId]) return;
    runInAction(() => {
      set(this.issuesMap, [issueId, "updated_at"], getCurrentDateTimeInISO());
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof TIssue]);
      });
    });
  };

  removeIssue = (issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return;
    runInAction(() => unset(this.issuesMap, issueId));
  };

  generateNotificationQueryParams = (paramType: TDraftIssuePaginationType): TNotificationQueryParams => {
    const queryCursorNext: string =
      paramType === EDraftIssuePaginationType.INIT
        ? `${this.paginatedCount}:0:0`
        : paramType === EDraftIssuePaginationType.CURRENT
          ? `${this.paginatedCount}:${0}:0`
          : paramType === EDraftIssuePaginationType.NEXT && this.paginationInfo
            ? (this.paginationInfo?.next_cursor ?? `${this.paginatedCount}:${0}:0`)
            : `${this.paginatedCount}:${0}:0`;

    const queryParams: TNotificationQueryParams = {
      cursor: queryCursorNext,
    };

    return queryParams;
  };

  // actions
  fetchIssues = async (workspaceSlug: string, loadType: TLoader) => {
    try {
      this.loader = loadType;

      // get params from pagination options
      // const params = this.issueFilterStore?.getFilterParams(options, workspaceSlug, undefined, undefined, undefined);
      const params = {};

      // call the fetch issues API with the params
      const response = await workspaceDraftService.getIssues(workspaceSlug, params);

      // update the issues map with the response
      // TODO: update the logic to handle pagination
      runInAction(() => {
        if (response?.results) this.addIssue(response?.results as TIssue[]);
      });

      return response;
    } catch (error) {
      // set loader to undefined if errored out
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    try {
      this.loader = "create";

      const response = await workspaceDraftService.createIssue(workspaceSlug, payload);
      if (response) {
        runInAction(() => {
          if (!this.issuesMap[response.id]) set(this.issuesMap, response.id, response);
          else update(this.issuesMap, response.id, (prevIssue) => ({ ...prevIssue, ...response }));
        });
      }

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, issueId: string, payload: Partial<TIssue>) => {
    try {
      this.loader = "create";

      const response = await workspaceDraftService.updateIssue(workspaceSlug, issueId, payload);
      if (response) {
        runInAction(() => {
          if (!this.issuesMap[response.id]) set(this.issuesMap, response.id, response);
          else update(this.issuesMap, response.id, (prevIssue) => ({ ...prevIssue, ...response }));
        });
      }

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  deleteIssue = async (workspaceSlug: string, issueId: string) => {
    try {
      this.loader = "delete";

      const response = await workspaceDraftService.deleteIssue(workspaceSlug, issueId);
      runInAction(() => {});

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  moveIssue = async (workspaceSlug: string, issueId: string, payload: Partial<TIssue>) => {
    try {
      this.loader = "move";

      const response = await workspaceDraftService.moveIssue(workspaceSlug, issueId, payload);
      runInAction(() => {});

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
    await this.rootIssueDetailStore.rootIssueStore.cycleIssues.addIssueToCycle(
      workspaceSlug,
      projectId,
      cycleId,
      issueIds,
      false
    );
    if (issueIds && issueIds.length > 0)
      await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueIds[0]);
  };

  changeModulesInIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => {
    await this.rootIssueDetailStore.rootIssueStore.moduleIssues.changeModulesInIssue(
      workspaceSlug,
      projectId,
      issueId,
      addModuleIds,
      removeModuleIds
    );
    await this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}

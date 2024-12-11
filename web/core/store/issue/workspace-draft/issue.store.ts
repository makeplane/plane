import clone from "lodash/clone";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import unset from "lodash/unset";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import {
  TWorkspaceDraftIssue,
  TWorkspaceDraftPaginationInfo,
  TWorkspaceDraftIssueLoader,
  TWorkspaceDraftQueryParams,
  TPaginationData,
  TLoader,
  TGroupedIssues,
  TSubGroupedIssues,
  ViewFlags,
  TIssue,
  TBulkOperationsPayload,
} from "@plane/types";
// constants
import { EDraftIssuePaginationType } from "@/constants/workspace-drafts";
// helpers
import { getCurrentDateTimeInISO, convertToISODateString } from "@/helpers/date-time.helper";
// local-db
import { addIssueToPersistanceLayer } from "@/local-db/utils/utils";
// services
import workspaceDraftService from "@/services/issue/workspace_draft.service";
// types
import { IIssueRootStore } from "../root.store";

export type TDraftIssuePaginationType = EDraftIssuePaginationType;

export interface IWorkspaceDraftIssues {
  // observables
  loader: TWorkspaceDraftIssueLoader;
  paginationInfo: Omit<TWorkspaceDraftPaginationInfo<TWorkspaceDraftIssue>, "results"> | undefined;
  issuesMap: Record<string, TWorkspaceDraftIssue>; // issue_id -> issue;
  issueMapIds: Record<string, string[]>; // workspace_id -> issue_ids;
  // computed
  issueIds: string[];
  // computed functions
  getIssueById: (issueId: string) => TWorkspaceDraftIssue | undefined;
  // helper actions
  addIssue: (issues: TWorkspaceDraftIssue[]) => void;
  mutateIssue: (issueId: string, data: Partial<TWorkspaceDraftIssue>) => void;
  removeIssue: (issueId: string) => Promise<void>;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    loadType: TWorkspaceDraftIssueLoader,
    paginationType?: TDraftIssuePaginationType
  ) => Promise<TWorkspaceDraftPaginationInfo<TWorkspaceDraftIssue> | undefined>;
  createIssue: (
    workspaceSlug: string,
    payload: Partial<TWorkspaceDraftIssue | TIssue>
  ) => Promise<TWorkspaceDraftIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    issueId: string,
    payload: Partial<TWorkspaceDraftIssue | TIssue>
  ) => Promise<TWorkspaceDraftIssue | undefined>;
  deleteIssue: (workspaceSlug: string, issueId: string) => Promise<void>;
  moveIssue: (workspaceSlug: string, issueId: string, payload: Partial<TWorkspaceDraftIssue>) => Promise<TIssue>;
  addCycleToIssue: (
    workspaceSlug: string,
    issueId: string,
    cycleId: string
  ) => Promise<TWorkspaceDraftIssue | undefined>;
  addModulesToIssue: (
    workspaceSlug: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<TWorkspaceDraftIssue | undefined>;

  // dummies
  viewFlags: ViewFlags;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined;
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  getPaginationData(groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined;
  getIssueLoader(groupId?: string, subGroupId?: string): TLoader;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  removeCycleFromIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;

  removeIssuesFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ) => Promise<void>;
  changeModulesInIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ): Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class WorkspaceDraftIssues implements IWorkspaceDraftIssues {
  // local constants
  paginatedCount = 50;
  // observables
  loader: TWorkspaceDraftIssueLoader = undefined;
  paginationInfo: Omit<TWorkspaceDraftPaginationInfo<TWorkspaceDraftIssue>, "results"> | undefined = undefined;
  issuesMap: Record<string, TWorkspaceDraftIssue> = {};
  issueMapIds: Record<string, string[]> = {};

  constructor(public issueStore: IIssueRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      paginationInfo: observable,
      issuesMap: observable,
      issueMapIds: observable,
      // computed
      issueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      deleteIssue: action,
      moveIssue: action,
      addCycleToIssue: action,
      addModulesToIssue: action,
    });
  }

  private updateWorkspaceUserDraftIssueCount(workspaceSlug: string, increment: number) {
    const workspaceUserInfo = this.issueStore.rootStore.user.permission.workspaceUserInfo;
    const currentCount = workspaceUserInfo[workspaceSlug]?.draft_issue_count ?? 0;

    set(workspaceUserInfo, [workspaceSlug, "draft_issue_count"], currentCount + increment);
  }

  // computed
  get issueIds() {
    const workspaceSlug = this.issueStore.workspaceSlug;
    if (!workspaceSlug) return [];
    if (!this.issueMapIds[workspaceSlug]) return [];
    const issueIds = this.issueMapIds[workspaceSlug];
    return orderBy(issueIds, (issueId) => convertToISODateString(this.issuesMap[issueId]?.created_at), ["desc"]);
  }

  // computed functions
  getIssueById = computedFn((issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return undefined;
    return this.issuesMap[issueId];
  });

  // helper actions
  addIssue = (issues: TWorkspaceDraftIssue[]) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.issuesMap[issue.id]) set(this.issuesMap, issue.id, issue);
        else update(this.issuesMap, issue.id, (prevIssue) => ({ ...prevIssue, ...issue }));
      });
    });
  };

  mutateIssue = (issueId: string, issue: Partial<TWorkspaceDraftIssue>) => {
    if (!issue || !issueId || !this.issuesMap[issueId]) return;
    runInAction(() => {
      set(this.issuesMap, [issueId, "updated_at"], getCurrentDateTimeInISO());
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof TWorkspaceDraftIssue]);
      });
    });
  };

  removeIssue = async (issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return;
    runInAction(() => unset(this.issuesMap, issueId));
  };

  generateNotificationQueryParams = (
    paramType: TDraftIssuePaginationType,
    filterParams = {}
  ): TWorkspaceDraftQueryParams => {
    const queryCursorNext: string =
      paramType === EDraftIssuePaginationType.INIT
        ? `${this.paginatedCount}:0:0`
        : paramType === EDraftIssuePaginationType.CURRENT
          ? `${this.paginatedCount}:${0}:0`
          : paramType === EDraftIssuePaginationType.NEXT && this.paginationInfo
            ? (this.paginationInfo?.next_cursor ?? `${this.paginatedCount}:${0}:0`)
            : `${this.paginatedCount}:${0}:0`;

    const queryParams: TWorkspaceDraftQueryParams = {
      per_page: this.paginatedCount,
      cursor: queryCursorNext,
      ...filterParams,
    };

    return queryParams;
  };

  // actions
  fetchIssues = async (
    workspaceSlug: string,
    loadType: TWorkspaceDraftIssueLoader,
    paginationType: TDraftIssuePaginationType = EDraftIssuePaginationType.INIT
  ) => {
    try {
      this.loader = loadType;

      // filter params and pagination params
      const filterParams = {};
      const params = this.generateNotificationQueryParams(paginationType, filterParams);

      // fetching the paginated workspace draft issues
      const draftIssuesResponse = await workspaceDraftService.getIssues(workspaceSlug, { ...params });
      if (!draftIssuesResponse) return undefined;

      const { results, ...paginationInfo } = draftIssuesResponse;
      runInAction(() => {
        if (results && results.length > 0) {
          // adding issueIds
          const issueIds = results.map((issue) => issue.id);
          this.addIssue(results);
          update(this.issueMapIds, [workspaceSlug], (existingIssueIds = []) => [...issueIds, ...existingIssueIds]);
          this.loader = undefined;
        } else {
          this.loader = "empty-state";
        }
        set(this, "paginationInfo", paginationInfo);
      });
      return draftIssuesResponse;
    } catch (error) {
      // set loader to undefined if errored out
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (
    workspaceSlug: string,
    payload: Partial<TWorkspaceDraftIssue | TIssue>
  ): Promise<TWorkspaceDraftIssue | undefined> => {
    try {
      this.loader = "create";

      const response = await workspaceDraftService.createIssue(workspaceSlug, payload);
      if (response) {
        runInAction(() => {
          this.addIssue([response]);
          update(this.issueMapIds, [workspaceSlug], (existingIssueIds = []) => [response.id, ...existingIssueIds]);
          // increase the count of issues in the pagination info
          if (this.paginationInfo?.total_count) {
            set(this, "paginationInfo", {
              ...this.paginationInfo,
              total_count: this.paginationInfo.total_count + 1,
            });
          }
          // Update draft issue count in workspaceUserInfo
          this.updateWorkspaceUserDraftIssueCount(workspaceSlug, 1);
        });
      }

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, issueId: string, payload: Partial<TWorkspaceDraftIssue | TIssue>) => {
    const issueBeforeUpdate = clone(this.getIssueById(issueId));
    try {
      this.loader = "update";
      runInAction(() => {
        set(this.issuesMap, [issueId], {
          ...issueBeforeUpdate,
          ...payload,
          ...{ updated_at: getCurrentDateTimeInISO() },
        });
      });
      const response = await workspaceDraftService.updateIssue(workspaceSlug, issueId, payload);
      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      runInAction(() => {
        set(this.issuesMap, [issueId], issueBeforeUpdate);
      });
      throw error;
    }
  };

  deleteIssue = async (workspaceSlug: string, issueId: string) => {
    try {
      this.loader = "delete";

      const response = await workspaceDraftService.deleteIssue(workspaceSlug, issueId);
      runInAction(() => {
        // Remove the issue from the issueMapIds
        this.issueMapIds[workspaceSlug] = (this.issueMapIds[workspaceSlug] || []).filter((id) => id !== issueId);
        // Remove the issue from the issuesMap
        delete this.issuesMap[issueId];
        // reduce the count of issues in the pagination info
        if (this.paginationInfo?.total_count) {
          set(this, "paginationInfo", {
            ...this.paginationInfo,
            total_count: this.paginationInfo.total_count - 1,
          });
        }
        // Update draft issue count in workspaceUserInfo
        this.updateWorkspaceUserDraftIssueCount(workspaceSlug, -1);
      });

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  moveIssue = async (workspaceSlug: string, issueId: string, payload: Partial<TWorkspaceDraftIssue>) => {
    try {
      this.loader = "move";

      const response = await workspaceDraftService.moveIssue(workspaceSlug, issueId, payload);
      runInAction(() => {
        // Remove the issue from the issueMapIds
        this.issueMapIds[workspaceSlug] = (this.issueMapIds[workspaceSlug] || []).filter((id) => id !== issueId);
        // Remove the issue from the issuesMap
        delete this.issuesMap[issueId];
        // reduce the count of issues in the pagination info
        if (this.paginationInfo?.total_count) {
          set(this, "paginationInfo", {
            ...this.paginationInfo,
            total_count: this.paginationInfo.total_count - 1,
          });
        }

        // sync issue to local db
        addIssueToPersistanceLayer({ ...payload, ...response });

        // Update draft issue count in workspaceUserInfo
        this.updateWorkspaceUserDraftIssueCount(workspaceSlug, -1);
      });

      this.loader = undefined;
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  addCycleToIssue = async (workspaceSlug: string, issueId: string, cycleId: string) => {
    try {
      this.loader = "update";
      const response = await this.updateIssue(workspaceSlug, issueId, { cycle_id: cycleId });
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  addModulesToIssue = async (workspaceSlug: string, issueId: string, moduleIds: string[]) => {
    try {
      this.loader = "update";
      const response = this.updateIssue(workspaceSlug, issueId, { module_ids: moduleIds });
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  // dummies
  viewFlags: ViewFlags = { enableQuickAdd: false, enableIssueCreation: false, enableInlineEditing: false };
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined = undefined;
  getIssueIds = (groupId?: string, subGroupId?: string) => undefined;
  getPaginationData = (groupId: string | undefined, subGroupId: string | undefined) => undefined;
  getIssueLoader = (groupId?: string, subGroupId?: string) => "loaded" as TLoader;
  getGroupIssueCount = (groupId: string | undefined, subGroupId: string | undefined, isSubGroupCumulative: boolean) =>
    undefined;
  removeCycleFromIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {};
  addIssueToCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => {};
  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {};

  removeIssuesFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {};
  changeModulesInIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => {};
  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {};
  archiveBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {};
  removeBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {};
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {};
}

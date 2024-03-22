import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, observable, makeObservable, runInAction } from "mobx";
// base class
// services
import { CycleService } from "services/cycle.service";
// types
import { TIssue, TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse } from "@plane/types";
import { IIssueRootStore } from "../root.store";
import { BaseIssuesStore, EIssueGroupedAction, IBaseIssuesStore } from "../helpers/base-issues.store";
import { ICycleIssuesFilter } from "./filter.store";

export const ACTIVE_CYCLE_ISSUES = "ACTIVE_CYCLE_ISSUES";

export interface ICycleIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>, cycleId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;

  addIssueToCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  transferIssuesFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => Promise<TIssue>;
  fetchActiveCycleIssues: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ) => Promise<TIssuesResponse | undefined>;
}

export class CycleIssues extends BaseIssuesStore implements ICycleIssues {
  cycleId: string | undefined = undefined;
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // service
  cycleService;
  // filter store
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: ICycleIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      // observable
      cycleId: observable.ref,
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,

      addIssueToCycle: action,
      removeIssueFromCycle: action,
      transferIssuesFromCycle: action,
      fetchActiveCycleIssues: action,

      quickAddIssue: action,
    });
    // service
    this.cycleService = new CycleService();
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    cycleId: string
  ) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();

      this.cycleId = cycleId;

      const params = this.issueFilterStore?.getFilterParams(options, undefined, undefined, undefined);
      const response = await this.cycleService.getCycleIssues(workspaceSlug, projectId, cycleId, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    groupId?: string,
    subGroupId?: string
  ) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      this.loader = "pagination";

      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        cursorObject?.nextCursor,
        groupId,
        subGroupId
      );
      const response = await this.cycleService.getCycleIssues(workspaceSlug, projectId, cycleId, params);

      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId: string
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions, cycleId);
  };

  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, cycleId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      await this.addIssueToCycle(workspaceSlug, projectId, cycleId, [response.id], false);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  addIssueToCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) => {
    try {
      await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      runInAction(() => {
        this.cycleId === cycleId && issueIds.forEach((issueId) => this.addIssueToList(issueId));
      });

      issueIds.forEach((issueId) => {
        this.rootIssueStore.issues.updateIssue(issueId, { cycle_id: cycleId });
      });

      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    try {
      await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
      runInAction(() => {
        this.cycleId === cycleId && this.removeIssueFromList(issueId);
      });

      this.rootIssueStore.issues.updateIssue(issueId, { cycle_id: null });
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  };

  transferIssuesFromCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => {
    try {
      const response = await this.cycleService.transferIssues(
        workspaceSlug as string,
        projectId as string,
        cycleId as string,
        payload
      );
      this.paginationOptions &&
        (await this.fetchIssues(workspaceSlug, projectId, "mutation", this.paginationOptions, cycleId));

      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchActiveCycleIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const params = { priority: `urgent,high` };
      const response = await this.cycleService.getCycleIssues(workspaceSlug, projectId, cycleId, params);

      // runInAction(() => {
      //   set(this.issues, , Object.keys(response));
      //   this.loader = undefined;
      // });

      // this.rootIssueStore.issues.addIssue(Object.values(response));

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  quickAddIssue = this.issueQuickAdd;
}

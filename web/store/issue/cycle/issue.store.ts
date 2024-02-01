import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TSubGroupedIssues, TGroupedIssues, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";

export const ACTIVE_CYCLE_ISSUES = "ACTIVE_CYCLE_ISSUES";

export interface ICycleIssues {
  // observable
  loader: TLoader;
  issues: { [cycle_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId?: string | undefined
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    cycleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    cycleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    cycleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    cycleId?: string | undefined
  ) => Promise<TIssue>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<TIssue>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<TIssue>;
  transferIssuesFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => Promise<TIssue>;
  fetchActiveCycleIssues: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<TIssue[] | undefined>;
}

export class CycleIssues extends IssueHelperStore implements ICycleIssues {
  loader: TLoader = "init-loader";
  issues: { [cycle_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  cycleService;
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable,
      // computed
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      quickAddIssue: action,
      addIssueToCycle: action,
      removeIssueFromCycle: action,
      transferIssuesFromCycle: action,
      fetchActiveCycleIssues: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
    this.cycleService = new CycleService();
  }

  get groupedIssueIds() {
    const cycleId = this.rootIssueStore?.cycleId;
    if (!cycleId) return undefined;

    const displayFilters = this.rootIssueStore?.cycleIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const cycleIssueIds = this.issues[cycleId];
    if (!cycleIssueIds) return;

    const _issues = this.rootIssueStore.issues.getIssuesByIds(cycleIssueIds);
    if (!_issues) return [];

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues = [];

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, _issues);
      else issues = this.groupedIssues(groupBy, orderBy, _issues);
    } else if (layout === "calendar") issues = this.groupedIssues("target_date", "target_date", _issues, true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", _issues);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", _issues);

    return issues;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      this.loader = loadType;

      const params = this.rootIssueStore?.cycleIssuesFilter?.appliedFilters;
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);

      runInAction(() => {
        set(
          this.issues,
          [cycleId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      await this.addIssueToCycle(workspaceSlug, projectId, cycleId, [response.id]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      const response = await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      const response = await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      runInAction(() => {
        this.issues[cycleId].push(data.id);
        this.rootIssueStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, cycleId);

      const quickAddIssueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
    try {
      const issueToCycle = await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: issueIds,
      });

      runInAction(() => {
        update(this.issues, cycleId, (cycleIssueIds = []) => uniq(concat(cycleIssueIds, issueIds)));
      });
      issueIds.forEach((issueId) => {
        this.rootStore.issues.updateIssue(issueId, { cycle_id: cycleId });
      });

      return issueToCycle;
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    try {
      runInAction(() => {
        pull(this.issues[cycleId], issueId);
      });

      this.rootStore.issues.updateIssue(issueId, { cycle_id: null });

      const response = await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);

      return response;
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
      await this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchActiveCycleIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const params = { priority: `urgent,high` };
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);

      runInAction(() => {
        set(this.issues, [ACTIVE_CYCLE_ISSUES], Object.keys(response));
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(Object.values(response));

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };
}

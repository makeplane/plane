import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// store
import { IIssueRootStore } from "../root.store";
// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// types
import {
  IGroupedIssues,
  IIssue,
  IIssueResponse,
  ISubGroupedIssues,
  TIssueGroupByOptions,
  TLoader,
  TUnGroupedIssues,
} from "types";
import { ViewFlags } from "store_legacy/issues/types";

export interface ICycleIssues {
  // observable
  loader: TLoader;
  issues: { [cycle_id: string]: string[] };
  // computed
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId?: string | undefined
  ) => Promise<IIssueResponse | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IIssue>,
    cycleId?: string | undefined
  ) => Promise<IIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    cycleId?: string | undefined
  ) => Promise<IIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    cycleId?: string | undefined
  ) => Promise<IIssue | undefined>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    cycleId?: string | undefined
  ) => Promise<IIssue | undefined>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<IIssue>;
  removeIssueFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueId: string,
    issueBridgeId: string
  ) => Promise<IIssue>;
  transferIssuesFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => Promise<IIssue>;
  viewFlags: ViewFlags;
}

export class CycleIssues extends IssueHelperStore implements ICycleIssues {
  loader: TLoader = "init-loader";
  issues: { [cycle_id: string]: string[] } = {};
  // root store
  rootStore;
  // service
  cycleService;
  issueService;

  //viewData
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      getIssuesIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      quickAddIssue: action,
      addIssueToCycle: action,
      removeIssueFromCycle: action,
      transferIssuesFromCycle: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
    this.cycleService = new CycleService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspaceSlug;
      const projectId = this.rootStore.projectId;
      const cycleId = this.rootStore.cycleId;
      if (!workspaceSlug || !projectId || !cycleId) return;

      const userFilters = this.rootStore?.cycleIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
    });
  }

  get getIssuesIds() {
    const cycleId = this.rootStore?.cycleId;
    if (!cycleId) return undefined;

    const displayFilters = this.rootStore?.cycleIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!cycleId || !this.issues || !this.issues[cycleId]) return undefined;

    const _issues = this.rootStore.issues.getIssuesByKey("project", cycleId);
    if (!_issues) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, _issues);
      else issues = this.groupedIssues(groupBy, orderBy, _issues);
    } else if (layout === "calendar")
      issues = this.groupedIssues("target_date" as TIssueGroupByOptions, "target_date", _issues, true);
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
    if (!cycleId) return undefined;

    try {
      this.loader = loadType;

      const params = this.rootStore?.cycleIssuesFilter?.appliedFilters;
      console.log("params", params);
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);
      console.log("response", response);

      runInAction(() => {
        set(this.issues, [cycleId], Object.keys(response));
        this.loader = undefined;
      });

      this.rootStore.issues.addIssue(Object.values(response));

      return response;
    } catch (error) {
      console.log(error);
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IIssue>,
    cycleId: string | undefined = undefined
  ) => {
    if (!cycleId) return undefined;

    try {
      const response = await this.rootStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      const issueToCycle = await this.addIssueToCycle(workspaceSlug, projectId, cycleId, [response.id]);

      return issueToCycle;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    cycleId: string | undefined = undefined
  ) => {
    if (!cycleId) return undefined;

    try {
      const response = await this.rootStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);

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
    if (!cycleId) return undefined;
    try {
      if (!issueId || !this.issues[cycleId]) return;

      const issueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(issueIndex, 1);
        });

      const response = await this.rootStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  quickAddIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    cycleId: string | undefined = undefined
  ) => {
    if (!cycleId) return;
    try {
      runInAction(() => {
        this.issues[cycleId].push(data.id);
        this.rootStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, cycleId);

      const quickAddIssueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(quickAddIssueIndex, 1);
          this.rootStore.issues.removeIssue(data.id);
        });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
    try {
      runInAction(() => {
        this.issues[cycleId].push(...issueIds);
      });

      const issueToCycle = await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: issueIds,
      });

      return issueToCycle;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  removeIssueFromCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueId: string,
    issueBridgeId: string
  ) => {
    try {
      const issueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(issueIndex, 1);
        });

      const response = await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueBridgeId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
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
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };
}

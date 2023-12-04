import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// types
import { CycleIssueResponse, TIssueGroupByOptions } from "types";
import { IIssue } from "types/issues";
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues, ViewFlags } from "../../types";
import { RootStore } from "store/root";

export interface ICycleIssuesStore {
  // observable
  loader: TLoader;
  issues: { [cycle_id: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
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
  addIssueToCycle: (
    workspaceSlug: string,
    cycleId: string,
    issueIds: string[],
    fetchAfterAddition?: boolean
  ) => Promise<IIssue>;
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

export class CycleIssuesStore extends IssueBaseStore implements ICycleIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [cycle_id: string]: IIssueResponse } | undefined = undefined;
  // root store
  rootStore;
  // service
  cycleService;
  issueService;

  //projectId
  currentProjectId: string | undefined;

  //viewData
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      getIssues: computed,
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
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      const cycleId = this.rootStore.cycle.cycleId;
      if (!workspaceSlug || !projectId || !cycleId) return;

      const userFilters = this.rootStore?.cycleIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
    });
  }

  get getIssues() {
    const cycleId = this.rootStore?.cycle?.cycleId;
    if (!cycleId || !this.issues || !this.issues[cycleId]) return undefined;

    return this.issues[cycleId];
  }

  get getIssuesIds() {
    const cycleId = this.rootStore?.cycle?.cycleId;
    const displayFilters = this.rootStore?.cycleIssuesFilter?.issueFilters?.displayFilters;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!cycleId || !this.issues || !this.issues[cycleId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[cycleId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[cycleId]);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, this.issues[cycleId]);
      else issues = this.groupedIssues(groupBy, orderBy, this.issues[cycleId]);
    } else if (layout === "calendar")
      issues = this.groupedIssues("target_date" as TIssueGroupByOptions, "target_date", this.issues[cycleId], true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", this.issues[cycleId]);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", this.issues[cycleId]);

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

      this.currentProjectId = projectId;

      const params = this.rootStore?.cycleIssuesFilter?.appliedFilters;
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);

      const _issues = { ...this.issues, [cycleId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      console.error(error);
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
      const issueToCycle = await this.addIssueToCycle(workspaceSlug, cycleId, [response.id], false);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[cycleId]) _issues[cycleId] = {};
      _issues[cycleId] = { ..._issues[cycleId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

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
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[cycleId]) _issues[cycleId] = {};
      _issues[cycleId][issueId] = { ..._issues[cycleId][issueId], ...data };

      runInAction(() => {
        this.issues = _issues;
      });

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
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[cycleId]) _issues[cycleId] = {};
      delete _issues?.[cycleId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
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
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[cycleId]) _issues[cycleId] = {};
      _issues[cycleId] = { ..._issues[cycleId], ...{ [data.id as keyof IIssue]: data } };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, cycleId);

      if (this.issues) {
        delete this.issues[cycleId][data.id as keyof IIssue];

        let _issues = { ...this.issues };
        if (!_issues) _issues = {};
        if (!_issues[cycleId]) _issues[cycleId] = {};
        _issues[cycleId] = { ..._issues[cycleId], ...{ [response.id as keyof IIssue]: response } };

        runInAction(() => {
          this.issues = _issues;
        });
      }

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  addIssueToCycle = async (workspaceSlug: string, cycleId: string, issueIds: string[], fetchAfterAddition = true) => {
    if (!this.currentProjectId) return;

    try {
      const issueToCycle = await this.issueService.addIssueToCycle(workspaceSlug, this.currentProjectId, cycleId, {
        issues: issueIds,
      });

      if (fetchAfterAddition) this.fetchIssues(workspaceSlug, this.currentProjectId, "mutation", cycleId);

      return issueToCycle;
    } catch (error) {
      this.fetchIssues(workspaceSlug, this.currentProjectId, "mutation", cycleId);
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
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[cycleId]) _issues[cycleId] = {};
      delete _issues?.[cycleId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
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

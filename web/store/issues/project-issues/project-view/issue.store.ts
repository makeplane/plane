import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { IssueService } from "services/issue/issue.service";
// types
import { TIssueGroupByOptions } from "types";
import { IIssue } from "types/issues";
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "../../types";
import { RootStore } from "store/root";

export interface IViewIssuesStore {
  // observable
  loader: TLoader;
  issues: { [view_id: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, viewId: string, loadType: TLoader) => Promise<IIssueResponse>;
  createIssue: (workspaceSlug: string, viewId: string, data: Partial<IIssue>) => Promise<IIssue>;
  updateIssue: (workspaceSlug: string, viewId: string, issueId: string, data: Partial<IIssue>) => Promise<IIssue>;
  removeIssue: (workspaceSlug: string, viewId: string, issueId: string) => Promise<IIssue>;
  quickAddIssue: (workspaceSlug: string, viewId: string, data: IIssue) => Promise<IIssue>;
}

export class ViewIssuesStore extends IssueBaseStore implements IViewIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [view_id: string]: IIssueResponse } | undefined = undefined;
  // root store
  rootStore;
  // service
  issueService;

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
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const viewId = this.rootStore.projectViews.viewId;
      if (!workspaceSlug || !viewId) return;

      const userFilters = this.rootStore?.viewIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, viewId, "mutation");
    });
  }

  get getIssues() {
    const viewId = this.rootStore?.projectViews.viewId;
    if (!viewId || !this.issues || !this.issues[viewId]) return undefined;

    return this.issues[viewId];
  }

  get getIssuesIds() {
    const viewId = this.rootStore?.projectViews.viewId;
    const displayFilters = this.rootStore?.viewIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!viewId || !this.issues || !this.issues[viewId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[viewId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[viewId]);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, this.issues[viewId]);
      else issues = this.groupedIssues(groupBy, orderBy, this.issues[viewId]);
    } else if (layout === "calendar")
      issues = this.groupedIssues("target_date" as TIssueGroupByOptions, "target_date", this.issues[viewId], true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", this.issues[viewId]);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", this.issues[viewId]);

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, viewId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.viewIssuesFilter?.appliedFilters;
      const response = await this.issueService.getV3Issues(workspaceSlug, viewId, params);

      const _issues = { ...this.issues, [viewId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId);
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, viewId: string, data: Partial<IIssue>) => {
    try {
      const response = await this.issueService.createIssue(workspaceSlug, viewId, data);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[viewId]) _issues[viewId] = {};
      _issues[viewId] = { ..._issues[viewId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, viewId: string, issueId: string, data: Partial<IIssue>) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[viewId]) _issues[viewId] = {};
      _issues[viewId][issueId] = { ..._issues[viewId][issueId], ...data };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.issueService.patchIssue(workspaceSlug, viewId, issueId, data);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, viewId: string, issueId: string) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[viewId]) _issues[viewId] = {};
      delete _issues?.[viewId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.issueService.deleteIssue(workspaceSlug, viewId, issueId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, viewId: string, data: IIssue) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[viewId]) _issues[viewId] = {};
      _issues[viewId] = { ..._issues[viewId], ...{ [data.id as keyof IIssue]: data } };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.issueService.createIssue(workspaceSlug, viewId, data);

      if (this.issues) {
        delete this.issues[viewId][data.id as keyof IIssue];

        let _issues = { ...this.issues };
        if (!_issues) _issues = {};
        if (!_issues[viewId]) _issues[viewId] = {};
        _issues[viewId] = { ..._issues[viewId], ...{ [response.id as keyof IIssue]: response } };

        runInAction(() => {
          this.issues = _issues;
        });
      }

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };
}

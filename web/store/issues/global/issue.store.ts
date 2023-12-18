import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { WorkspaceService } from "services/workspace.service";
import { IssueService } from "services/issue";
// types
import { IIssue } from "types/issues";
import { IIssueResponse, TLoader, TUnGroupedIssues, ViewFlags } from "../types";
import { RootStore } from "store/root";
import isEmpty from "lodash/isEmpty";

export interface IGlobalIssuesStore {
  // observable
  loader: TLoader;
  issues: { [workspace_view: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, workspaceViewId: string, loadType: TLoader) => Promise<IIssueResponse>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IIssue>,
    workspaceViewId?: string | undefined
  ) => Promise<IIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    workspaceViewId?: string | undefined
  ) => Promise<IIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    workspaceViewId?: string | undefined
  ) => Promise<IIssue | undefined>;

  viewFlags: ViewFlags;
}

export class GlobalIssuesStore extends IssueBaseStore implements IGlobalIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [workspace_view: string]: IIssueResponse } | undefined = undefined;
  // root store
  rootStore;
  // service
  workspaceService;
  issueService;
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
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.issueService = new IssueService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const currentView = this.rootStore.workspaceGlobalIssuesFilter?.currentView;
      if (!workspaceSlug || currentView === "") return;

      const userFilters = this.rootStore?.workspaceGlobalIssuesFilter?.issueFilters?.filters;

      if (!isEmpty(userFilters)) this.fetchIssues(workspaceSlug, currentView, "mutation");
    });
  }

  get getIssues() {
    const currentView = this.rootStore.workspaceGlobalIssuesFilter?.currentView;
    if (currentView === "" || !this.issues || !this.issues[currentView]) return undefined;

    return this.issues[currentView];
  }

  get getIssuesIds() {
    const currentView = this.rootStore.workspaceGlobalIssuesFilter?.currentView;
    const displayFilters = this.rootStore?.workspaceGlobalIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const orderBy = displayFilters?.order_by;

    if (currentView === "" || !this.issues || !this.issues[currentView]) return undefined;

    let issues: IIssueResponse | TUnGroupedIssues | undefined = undefined;

    issues = this.unGroupedIssues(orderBy ?? "-created_at", this.issues[currentView]);

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, workspaceViewId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.workspaceGlobalIssuesFilter?.appliedFilters;
      const response = await this.workspaceService.getViewIssues(workspaceSlug, params);

      const _issues = { ...this.issues, [workspaceViewId]: { ...response } };

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
    workspaceViewId: string | undefined = undefined
  ) => {
    if (!workspaceViewId) return;

    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[workspaceViewId]) _issues[workspaceViewId] = {};
      _issues[workspaceViewId] = { ..._issues[workspaceViewId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, workspaceViewId, "mutation");
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    workspaceViewId: string | undefined = undefined
  ) => {
    if (!workspaceViewId) return;

    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[workspaceViewId]) _issues[workspaceViewId] = {};
      _issues[workspaceViewId][issueId] = { ..._issues[workspaceViewId][issueId], ...data };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);

      runInAction(() => {
        _issues = { ...this.issues };
        _issues[workspaceViewId][issueId] = { ..._issues[workspaceViewId][issueId], ...response };
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, workspaceViewId, "mutation");
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    workspaceViewId: string | undefined = undefined
  ) => {
    if (!workspaceViewId) return;

    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[workspaceViewId]) _issues[workspaceViewId] = {};
      delete _issues?.[workspaceViewId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, workspaceViewId, "mutation");
      throw error;
    }
  };
}

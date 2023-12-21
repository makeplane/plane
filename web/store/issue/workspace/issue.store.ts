import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// store
import { IIssueRootStore } from "../root.store";
// services
import { WorkspaceService } from "services/workspace.service";
import { IssueService } from "services/issue";
// types
import { IIssue, IIssueResponse, TLoader, TUnGroupedIssues, ViewFlags } from "types";

export interface IWorkspaceIssues {
  // observable
  loader: TLoader;
  issues: { [viewId: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, viewId: string, loadType: TLoader) => Promise<IIssueResponse>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IIssue>,
    viewId?: string | undefined
  ) => Promise<IIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    viewId?: string | undefined
  ) => Promise<IIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId?: string | undefined
  ) => Promise<IIssue | undefined>;
}

export class WorkspaceIssues extends IssueHelperStore implements IWorkspaceIssues {
  loader: TLoader = "init-loader";
  issues: { [viewId: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  workspaceService;
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();
    this.issueService = new IssueService();
  }

  get groupedIssueIds() {
    const viewId = this.rootIssueStore.workspaceIssuesFilter?.viewId;
    if (!viewId) return undefined;

    const displayFilters = this.rootIssueStore?.workspaceIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const orderBy = displayFilters?.order_by;

    const viewIssueIds = this.issues[viewId] ?? [];

    const _issues = this.rootStore.issues.getIssuesByIds(viewIssueIds);
    if (!_issues) return undefined;

    let issues: IIssueResponse | TUnGroupedIssues | undefined = undefined;

    issues = this.unGroupedIssues(orderBy ?? "-created_at", _issues);

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, viewId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootIssueStore?.workspaceIssuesFilter?.appliedFilters;
      const response = await this.workspaceService.getViewIssues(workspaceSlug, params);

      runInAction(() => {
        set(this.issues, [viewId], Object.keys(response));
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(Object.values(response));

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
    viewId: string | undefined = undefined
  ) => {
    if (!viewId) return;

    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[viewId].push(response.id);
      });

      this.rootStore.issues.addIssue([response]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    viewId: string | undefined = undefined
  ) => {
    if (!viewId) return;

    try {
      this.rootStore.issues.updateIssue(issueId, data);
      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, viewId, "mutation");
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId: string | undefined = undefined
  ) => {
    if (!viewId) return;

    try {
      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[viewId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[viewId].splice(issueIndex, 1);
        });

      this.rootStore.issues.removeIssue(issueId);

      return response;
    } catch (error) {
      throw error;
    }
  };
}

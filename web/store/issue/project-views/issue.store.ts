import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueService } from "services/issue/issue.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";

export interface IProjectViewIssues {
  // observable
  loader: TLoader;
  issues: { [view_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    viewId?: string | undefined
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    viewId?: string | undefined
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    viewId?: string | undefined
  ) => Promise<TIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId?: string | undefined
  ) => Promise<TIssue | undefined>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string | undefined
  ) => Promise<TIssue | undefined>;
}

export class ProjectViewIssues extends IssueHelperStore implements IProjectViewIssues {
  loader: TLoader = "init-loader";
  issues: { [view_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // services
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
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueService = new IssueService();
  }

  get groupedIssueIds() {
    const viewId = this.rootStore?.viewId;
    if (!viewId) return undefined;

    const displayFilters = this.rootIssueStore?.projectViewIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const viewIssueIds = this.issues[viewId];
    if (!viewIssueIds) return;

    const _issues = this.rootStore.issues.getIssuesByIds(viewIssueIds);
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
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View Id is required");

      this.loader = loadType;

      const params = this.rootIssueStore?.projectViewIssuesFilter?.appliedFilters;
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      runInAction(() => {
        set(
          this.issues,
          [viewId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

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
    data: Partial<TIssue>,
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View Id is required");

      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[viewId].push(response.id);
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View Id is required");

      const response = await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View Id is required");

      const response = await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[viewId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[viewId].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  quickAddIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId: string | undefined = undefined
  ) => {
    try {
      if (!viewId) throw new Error("View Id is required");

      runInAction(() => {
        this.issues[viewId].push(data.id);
        this.rootIssueStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, viewId);

      const quickAddIssueIndex = this.issues[viewId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues[viewId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };
}

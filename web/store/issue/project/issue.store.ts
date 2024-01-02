import { action, makeObservable, observable, runInAction, computed } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueService } from "services/issue/issue.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TGroupedIssues, TSubGroupedIssues, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";

export interface IProjectIssues {
  // observable
  loader: TLoader;
  issues: Record<string, string[]>; // Record of project_id as key and issue_ids as value
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // action
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<TIssue[]>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<TIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssue>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue>;
}

export class ProjectIssues extends IssueHelperStore implements IProjectIssues {
  // observable
  loader: TLoader = "init-loader";
  issues: Record<string, string[]> = {};
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
    const projectId = this.rootStore?.projectId;
    if (!projectId) return undefined;

    const displayFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const projectIssueIds = this.issues[projectId] ?? [];

    const _issues = this.rootStore.issues.getIssuesByIds(projectIssueIds);
    if (!_issues) return undefined;

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

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

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.projectIssuesFilter?.appliedFilters;
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      runInAction(() => {
        set(
          this.issues,
          [projectId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootStore.issues.addIssue(response);

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[projectId].push(response.id);
      });

      this.rootStore.issues.addIssue([response]);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    try {
      if (!issueId || !this.issues[projectId]) return;

      this.rootStore.issues.updateIssue(issueId, data);

      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      if (!issueId || !this.issues[projectId]) return;

      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[projectId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[projectId].splice(issueIndex, 1);
        });

      this.rootStore.issues.removeIssue(issueId);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, projectId: string, data: TIssue) => {
    try {
      runInAction(() => {
        this.issues[projectId].push(data.id);
        this.rootStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data);

      const quickAddIssueIndex = this.issues[projectId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues[projectId].splice(quickAddIssueIndex, 1);
          this.rootStore.issues.removeIssue(data.id);
        });
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };
}

import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueDraftService } from "services/issue/issue_draft.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";

export interface IDraftIssues {
  // observable
  loader: TLoader;
  issues: { [project_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<TIssue[]>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<TIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssue>;
  quickAddIssue: undefined;
}

export class DraftIssues extends IssueHelperStore implements IDraftIssues {
  loader: TLoader = "init-loader";
  issues: { [project_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: true,
    enableInlineEditing: false,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  issueDraftService;

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
    });
    // root store
    this.rootIssueStore = _rootStore;
    this.issueDraftService = new IssueDraftService();
  }

  get getIssues() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    return this.issues[projectId];
  }

  get groupedIssueIds() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    const displayFilters = this.rootIssueStore?.draftIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const draftIssueIds = this.issues[projectId] ?? [];

    const _issues = this.rootIssueStore.issues.getIssuesByIds(draftIssueIds);
    if (!_issues) return undefined;

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, _issues);
      else issues = this.groupedIssues(groupBy, orderBy, _issues);
    }

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootIssueStore?.draftIssuesFilter?.appliedFilters;
      const response = await this.issueDraftService.getDraftIssues(workspaceSlug, projectId, params);

      runInAction(() => {
        set(
          this.issues,
          [projectId],
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

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
    try {
      const response = await this.issueDraftService.createDraftIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[projectId].push(response.id);
      });

      this.rootStore.issues.addIssue([response]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    try {
      this.rootStore.issues.updateIssue(issueId, data);
      const response = await this.issueDraftService.updateDraftIssue(workspaceSlug, projectId, issueId, data);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueDraftService.deleteDraftIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[projectId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[projectId].splice(issueIndex, 1);
        });

      this.rootStore.issues.removeIssue(issueId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue: undefined;
}

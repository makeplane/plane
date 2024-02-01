import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueArchiveService } from "services/issue";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";

export interface IArchivedIssues {
  // observable
  loader: TLoader;
  issues: { [project_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<TIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssue>;
  removeIssueFromArchived: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: undefined;
}

export class ArchivedIssues extends IssueHelperStore implements IArchivedIssues {
  loader: TLoader = "init-loader";
  issues: { [project_id: string]: string[] } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  archivedIssueService;

  //viewData
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };

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
      removeIssue: action,
      removeIssueFromArchived: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.archivedIssueService = new IssueArchiveService();
  }

  get groupedIssueIds() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    const displayFilters = this.rootIssueStore?.archivedIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const archivedIssueIds = this.issues[projectId] ?? [];

    const _issues = this.rootIssueStore.issues.getIssuesByIds(archivedIssueIds);
    if (!_issues) return undefined;

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    }

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootIssueStore?.archivedIssuesFilter?.appliedFilters;
      const response = await this.archivedIssueService.getArchivedIssues(workspaceSlug, projectId, params);

      runInAction(() => {
        set(
          this.issues,
          [projectId],
          response.map((issue: TIssue) => issue.id)
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

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[projectId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[projectId].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromArchived = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.archivedIssueService.unarchiveIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[projectId]?.findIndex((_issueId) => _issueId === issueId);
      if (issueIndex && issueIndex >= 0)
        runInAction(() => {
          this.issues[projectId].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue: undefined;
}

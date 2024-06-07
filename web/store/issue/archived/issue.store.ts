import pull from "lodash/pull";
import set from "lodash/set";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// base class
import { IssueArchiveService } from "@/services/issue";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
// types
import { IIssueRootStore } from "../root.store";

export interface IArchivedIssues {
  // observable
  loader: TLoader;
  issues: { [project_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  getIssueIds: (groupId?: string) => string[] | undefined;
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<TIssue[]>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restoreIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
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
      restoreIssue: action,
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

    const archivedIssueIds = this.issues[projectId];
    if (!archivedIssueIds) return undefined;

    const _issues = this.rootIssueStore.issues.getIssuesByIds(archivedIssueIds, "archived");
    if (!_issues) return [];

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    }

    return issues;
  }

  getIssueIds = (groupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    const displayFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters || !groupedIssueIds) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;

    if (!groupBy && !subGroupBy) {
      return groupedIssueIds as string[];
    }

    if (groupBy && groupId) {
      return (groupedIssueIds as TGroupedIssues)?.[groupId] as string[];
    }

    return undefined;
  };

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
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        pull(this.issues[projectId], issueId);
      });
    } catch (error) {
      throw error;
    }
  };

  restoreIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.archivedIssueService.restoreIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootStore.issues.updateIssue(issueId, {
          archived_at: null,
        });
        pull(this.issues[projectId], issueId);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue: undefined;
}

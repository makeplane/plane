import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import uniq from "lodash/uniq";
import concat from "lodash/concat";
import pull from "lodash/pull";
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
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: undefined;
}

export class DraftIssues extends IssueHelperStore implements IDraftIssues {
  loader: TLoader = "init-loader";
  issues: { [project_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: true,
    enableInlineEditing: true,
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

    const draftIssueIds = this.issues[projectId];
    if (!draftIssueIds) return undefined;

    const _issues = this.rootIssueStore.issues.getIssuesByIds(draftIssueIds);
    if (!_issues) return [];

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
        update(this.issues, [projectId], (issueIds = []) => uniq(concat(issueIds, response.id)));
      });

      this.rootStore.issues.addIssue([response]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    try {
      await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);

      if (data.hasOwnProperty("is_draft") && data?.is_draft === false) {
        runInAction(() => {
          update(this.issues, [projectId], (issueIds = []) => {
            if (issueIds.includes(issueId)) pull(issueIds, issueId);
            return issueIds;
          });
        });
      }
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        update(this.issues, [projectId], (issueIds = []) => {
          if (issueIds.includes(issueId)) pull(issueIds, issueId);
          return issueIds;
        });
      });
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue: undefined;
}

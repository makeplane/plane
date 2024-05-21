import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction, computed } from "mobx";
// types
import { TIssue, TGroupedIssues, TSubGroupedIssues, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";
// helpers
import { issueCountBasedOnFilters } from "@/helpers/issue.helper";
// base class
import { IssueService, IssueArchiveService } from "@/services/issue";
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IIssueRootStore } from "../root.store";

export interface IProjectIssues {
  // observable
  loader: TLoader;
  issues: Record<string, string[]>; // Record of project_id as key and issue_ids as value
  viewFlags: ViewFlags;
  // computed
  issuesCount: number;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  // action
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<TIssue[]>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
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
  issueArchiveService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable,
      // computed
      issuesCount: computed,
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      removeBulkIssues: action,
      quickAddIssue: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
  }

  get issuesCount() {
    let issuesCount = 0;

    const displayFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.displayFilters;
    const groupedIssueIds = this.groupedIssueIds;
    if (!displayFilters || !groupedIssueIds) return issuesCount;

    const layout = displayFilters?.layout || undefined;
    const groupBy = displayFilters?.group_by || undefined;
    const subGroupBy = displayFilters?.sub_group_by || undefined;

    if (!layout) return issuesCount;
    issuesCount = issueCountBasedOnFilters(groupedIssueIds, layout, groupBy, subGroupBy);
    return issuesCount;
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

    const projectIssueIds = this.issues[projectId];
    if (!projectIssueIds) return;

    const _issues = this.rootStore.issues.getIssuesByIds(projectIssueIds, "un-archived");
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

  getIssueIds = (groupId?: string, subGroupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    const displayFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters || !groupedIssueIds) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;

    if (!groupBy && !subGroupBy) {
      return groupedIssueIds as string[];
    }

    if (groupBy && subGroupBy && groupId && subGroupId) {
      return (groupedIssueIds as TSubGroupedIssues)?.[subGroupId]?.[groupId] as string[];
    }

    if (groupBy && groupId) {
      return (groupedIssueIds as TGroupedIssues)?.[groupId] as string[];
    }

    return undefined;
  };

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
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);

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
        update(this.issues, [projectId], (issueIds) => {
          if (!issueIds) return [response.id];
          return concat(issueIds, response.id);
        });
      });

      this.rootStore.issues.addIssue([response]);
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
    try {
      this.rootStore.issues.updateIssue(issueId, data);

      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        pull(this.issues[projectId], issueId);
      });

      this.rootStore.issues.removeIssue(issueId);
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootStore.issues.updateIssue(issueId, {
          archived_at: response.archived_at,
        });
        pull(this.issues[projectId], issueId);
      });

      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
    } catch (error) {
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

      if (data.cycle_id && data.cycle_id !== "")
        await this.rootStore.cycleIssues.addIssueToCycle(workspaceSlug, projectId, data.cycle_id, [response.id]);

      if (data.module_ids && data.module_ids.length > 0)
        await this.rootStore.moduleIssues.changeModulesInIssue(
          workspaceSlug,
          projectId,
          response.id,
          data.module_ids,
          []
        );

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

  removeBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
      runInAction(() => {
        issueIds.forEach((issueId) => {
          pull(this.issues[projectId], issueId);
          this.rootStore.issues.removeIssue(issueId);
        });
      });

      const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };
}

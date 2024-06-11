import pull from "lodash/pull";
import set from "lodash/set";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";
// base class
import { IssueService } from "@/services/issue/issue.service";
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
// types
import { IIssueRootStore } from "../root.store";

export interface IProjectViewIssues {
  // observable
  loader: TLoader;
  issues: { [view_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    viewId: string
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    viewId: string
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    viewId: string
  ) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => Promise<void>;
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
      archiveIssue: action,
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

    const currentIssues = this.rootStore.issues.getIssuesByIds(viewIssueIds, "un-archived");
    if (!currentIssues) return [];

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues = [];

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, currentIssues);
      else issues = this.unGroupedIssues(orderBy, currentIssues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, currentIssues);
      else issues = this.groupedIssues(groupBy, orderBy, currentIssues);
    } else if (layout === "calendar") issues = this.groupedIssues("target_date", "target_date", currentIssues, true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", currentIssues);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", currentIssues);

    return issues;
  }

  getIssueIds = (groupId?: string, subGroupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    const displayFilters = this.rootIssueStore?.projectViewIssuesFilter?.issueFilters?.displayFilters;
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

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader", viewId: string) => {
    try {
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

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, viewId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[viewId].push(response.id);
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", viewId);
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    viewId: string
  ) => {
    try {
      await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", viewId);
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => {
    try {
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[viewId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[viewId].splice(issueIndex, 1);
        });
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", viewId);
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string, viewId: string) => {
    try {
      await this.rootIssueStore.projectIssues.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        pull(this.issues[viewId], issueId);
      });
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", viewId);
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
      if (quickAddIssueIndex >= 0) {
        runInAction(() => {
          this.issues[viewId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });
      }

      const currentCycleId = data.cycle_id !== "" && data.cycle_id === "None" ? undefined : data.cycle_id;
      const currentModuleIds =
        data.module_ids && data.module_ids.length > 0 ? data.module_ids.filter((moduleId) => moduleId != "None") : [];

      const multipleIssuePromises = [];
      if (currentCycleId) {
        multipleIssuePromises.push(
          this.rootStore.cycleIssues.addCycleToIssue(workspaceSlug, projectId, currentCycleId, response.id)
        );
      }

      if (currentModuleIds.length > 0) {
        multipleIssuePromises.push(
          this.rootStore.moduleIssues.changeModulesInIssue(workspaceSlug, projectId, response.id, currentModuleIds, [])
        );
      }

      if (multipleIssuePromises && multipleIssuePromises.length > 0) {
        await Promise.all(multipleIssuePromises);
      }

      return response;
    } catch (error) {
      if (viewId) this.fetchIssues(workspaceSlug, projectId, "mutation", viewId);
      throw error;
    }
  };
}

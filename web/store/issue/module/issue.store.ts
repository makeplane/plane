import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import pull from "lodash/pull";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";

export interface IModuleIssues {
  // observable
  loader: TLoader;
  issues: { [module_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    moduleId?: string | undefined
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    moduleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    moduleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    moduleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  addIssueToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<any>;
  removeIssueFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<TIssue>;
}

export class ModuleIssues extends IssueHelperStore implements IModuleIssues {
  loader: TLoader = "init-loader";
  issues: { [module_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  moduleService;
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
      addIssueToModule: action,
      removeIssueFromModule: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
    this.moduleService = new ModuleService();
  }

  get groupedIssueIds() {
    const moduleId = this.rootIssueStore?.moduleId;
    if (!moduleId) return undefined;

    const displayFilters = this.rootIssueStore?.moduleIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const moduleIssueIds = this.issues[moduleId] ?? [];

    const _issues = this.rootIssueStore.issues.getIssuesByIds(moduleIssueIds);
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

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    moduleId: string | undefined = undefined
  ) => {
    try {
      if (!moduleId) throw new Error("Module Id is required");

      this.loader = loadType;

      const params = this.rootIssueStore?.moduleIssuesFilter?.appliedFilters;
      const response = await this.moduleService.getModuleIssues(workspaceSlug, projectId, moduleId, params);

      runInAction(() => {
        set(
          this.issues,
          [moduleId],
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
    moduleId: string | undefined = undefined
  ) => {
    try {
      if (!moduleId) throw new Error("Module Id is required");

      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      await this.addIssueToModule(workspaceSlug, projectId, moduleId, [response.id]);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    moduleId: string | undefined = undefined
  ) => {
    try {
      if (!moduleId) throw new Error("Module Id is required");

      const response = await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", moduleId);
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleId: string | undefined = undefined
  ) => {
    try {
      if (!moduleId) throw new Error("Module Id is required");

      const response = await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[moduleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[moduleId].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    moduleId: string | undefined = undefined
  ) => {
    try {
      if (!moduleId) throw new Error("Module Id is required");

      runInAction(() => {
        this.issues[moduleId].push(data.id);
        this.rootIssueStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, moduleId);

      const quickAddIssueIndex = this.issues[moduleId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0)
        runInAction(() => {
          this.issues[moduleId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  addIssueToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
    try {
      const issueToModule = await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      runInAction(() => {
        update(this.issues, moduleId, (moduleIssueIds) => {
          if (!moduleIssueIds) return [...issueIds];
          else return concat(moduleIssueIds, [...issueIds]);
        });
      });

      return issueToModule;
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
    try {
      runInAction(() => {
        pull(this.issues[moduleId], issueId);
      });

      this.rootStore.issues.updateIssue(issueId, { module_id: null });

      const response = await this.moduleService.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);

      return response;
    } catch (error) {
      throw error;
    }
  };
}

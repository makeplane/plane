import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// types
import { TIssueGroupByOptions } from "types";
import { IIssue } from "types/issues";
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "../../types";
import { RootStore } from "store/root";

export interface IModuleIssuesStore {
  // observable
  loader: TLoader;
  issues: { [module_id: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    loadType: TLoader
  ) => Promise<IIssueResponse>;
  createIssue: (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IIssue>) => Promise<IIssue>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string,
    data: Partial<IIssue>
  ) => Promise<IIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<IIssue>;
  quickAddIssue: (workspaceSlug: string, projectId: string, moduleId: string, data: IIssue) => Promise<IIssue>;
}

export class ModuleIssuesStore extends IssueBaseStore implements IModuleIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [module_id: string]: IIssueResponse } | undefined = undefined;
  // root store
  rootStore;
  // service
  moduleService;
  issueService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      getIssues: computed,
      getIssuesIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      quickAddIssue: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
    this.moduleService = new ModuleService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      const moduleId = this.rootStore.module.moduleId;
      if (!workspaceSlug || !projectId || !moduleId) return;

      const userFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, projectId, moduleId, "mutation");
    });
  }

  get getIssues() {
    const projectId = this.rootStore?.project.projectId;
    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    return this.issues[projectId];
  }

  get getIssuesIds() {
    const projectId = this.rootStore?.project.projectId;
    const displayFilters = this.rootStore?.projectIssuesFilter?.issueFilters?.displayFilters;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[projectId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[projectId]);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, this.issues[projectId]);
      else issues = this.groupedIssues(groupBy, orderBy, this.issues[projectId]);
    } else if (layout === "calendar")
      issues = this.groupedIssues("target_date" as TIssueGroupByOptions, "target_date", this.issues[projectId], true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", this.issues[projectId]);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", this.issues[projectId]);

    return issues;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    loadType: TLoader = "init-loader"
  ) => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.projectIssuesFilter?.appliedFilters;
      const response = await this.moduleService.getV3ModuleIssues(workspaceSlug, projectId, moduleId, params);

      const _issues = { ...this.issues, [moduleId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId);
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IIssue>) => {
    try {
      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data, user);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[moduleId]) _issues[moduleId] = {};
      _issues[moduleId] = { ..._issues[moduleId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId, "mutation");
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string,
    data: Partial<IIssue>
  ) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[moduleId]) _issues[moduleId] = {};
      _issues[moduleId][issueId] = { ..._issues[moduleId][issueId], ...data };

      runInAction(() => {
        this.issues = _issues;
      });

      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data, user);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[moduleId]) _issues[moduleId] = {};
      delete _issues?.[moduleId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId, user);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId, "mutation");
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, projectId: string, moduleId: string, data: IIssue) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[moduleId]) _issues[moduleId] = {};
      _issues[moduleId] = { ..._issues[moduleId], ...{ [data.id as keyof IIssue]: data } };

      runInAction(() => {
        this.issues = _issues;
      });

      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data, user);

      if (this.issues) {
        delete this.issues[moduleId][data.id as keyof IIssue];

        let _issues = { ...this.issues };
        if (!_issues) _issues = {};
        if (!_issues[moduleId]) _issues[moduleId] = {};
        _issues[moduleId] = { ..._issues[moduleId], ...{ [response.id as keyof IIssue]: response } };

        runInAction(() => {
          this.issues = _issues;
        });
      }

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId, "mutation");
      throw error;
    }
  };
}

import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
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
  addIssuesToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<void>;
  removeIssuesFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ) => Promise<void>;
  addModulesToIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<void>;
  removeModulesFromIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
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
      addIssuesToModule: action,
      removeIssuesFromModule: action,
      addModulesToIssue: action,
      removeModulesFromIssue: action,
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

    const moduleIssueIds = this.issues[moduleId];
    if (!moduleIssueIds) return;

    const _issues = this.rootIssueStore.issues.getIssuesByIds(moduleIssueIds);
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
      await this.addIssuesToModule(workspaceSlug, projectId, moduleId, [response.id]);

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
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
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

  addIssuesToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
    try {
      const issueToModule = await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      runInAction(() => {
        update(this.issues, moduleId, (moduleIssueIds = []) => {
          if (!moduleIssueIds) return [...issueIds];
          else return uniq(concat(moduleIssueIds, issueIds));
        });
      });

      issueIds.forEach((issueId) => {
        update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) => {
          if (issueModuleIds.includes(moduleId)) return issueModuleIds;
          else return uniq(concat(issueModuleIds, [moduleId]));
        });
      });

      return issueToModule;
    } catch (error) {
      throw error;
    }
  };

  removeIssuesFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
    try {
      runInAction(() => {
        issueIds.forEach((issueId) => {
          pull(this.issues[moduleId], issueId);
        });
      });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) => {
            if (issueModuleIds.includes(moduleId)) return pull(issueModuleIds, moduleId);
            else return uniq(concat(issueModuleIds, [moduleId]));
          });
        });
      });

      const response = await this.moduleService.removeIssuesFromModuleBulk(
        workspaceSlug,
        projectId,
        moduleId,
        issueIds
      );

      return response;
    } catch (error) {
      throw error;
    }
  };

  addModulesToIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    try {
      const issueToModule = await this.moduleService.addModulesToIssue(workspaceSlug, projectId, issueId, {
        modules: moduleIds,
      });

      runInAction(() => {
        moduleIds.forEach((moduleId) => {
          update(this.issues, moduleId, (moduleIssueIds = []) => {
            if (moduleIssueIds.includes(issueId)) return moduleIssueIds;
            else return uniq(concat(moduleIssueIds, [issueId]));
          });
        });
        update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
          uniq(concat(issueModuleIds, moduleIds))
        );
      });

      return issueToModule;
    } catch (error) {
      throw error;
    }
  };

  removeModulesFromIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
    try {
      runInAction(() => {
        moduleIds.forEach((moduleId) => {
          update(this.issues, moduleId, (moduleIssueIds = []) => {
            if (moduleIssueIds.includes(issueId)) return moduleIssueIds;
            else return uniq(concat(moduleIssueIds, [issueId]));
          });
          update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
            pull(issueModuleIds, moduleId)
          );
        });
      });

      const response = await this.moduleService.removeModulesFromIssueBulk(
        workspaceSlug,
        projectId,
        issueId,
        moduleIds
      );

      return response;
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
    try {
      runInAction(() => {
        pull(this.issues[moduleId], issueId);
        update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
          pull(issueModuleIds, moduleId)
        );
      });

      const response = await this.moduleService.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);

      return response;
    } catch (error) {
      throw error;
    }
  };
}

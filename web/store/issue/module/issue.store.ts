import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// types
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";
// helpers
import { issueCountBasedOnFilters } from "@/helpers/issue.helper";
// services
import { IssueService } from "@/services/issue";
import { ModuleService } from "@/services/module.service";
// helpers
import { IssueHelperStore } from "../helpers/issue-helper.store";
// store
import { IIssueRootStore } from "../root.store";

export interface IModuleIssues {
  // observable
  loader: TLoader;
  issues: { [module_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  issuesCount: number;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    moduleId: string
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    moduleId: string
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    moduleId: string
  ) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleId: string) => Promise<void>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    moduleId?: string | undefined
  ) => Promise<TIssue | undefined>;
  addIssuesToModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssuesFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ) => Promise<void>;
  changeModulesInIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => Promise<void>;
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
      issuesCount: computed,
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      quickAddIssue: action,
      addIssuesToModule: action,
      removeIssuesFromModule: action,
      changeModulesInIssue: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
    this.moduleService = new ModuleService();
  }

  get issuesCount() {
    let issuesCount = 0;

    const displayFilters = this.rootIssueStore?.moduleIssuesFilter?.issueFilters?.displayFilters;
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

    const currentIssues = this.rootIssueStore.issues.getIssuesByIds(moduleIssueIds, "un-archived");
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

    const displayFilters = this.rootIssueStore?.moduleIssuesFilter?.issueFilters?.displayFilters;
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

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    moduleId: string
  ) => {
    try {
      this.loader = loadType;

      const params = this.rootIssueStore?.moduleIssuesFilter?.appliedFilters;
      const response = await this.moduleService.getModuleIssues(workspaceSlug, projectId, moduleId, params);
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

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

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, moduleId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      await this.addIssuesToModule(workspaceSlug, projectId, moduleId, [response.id], false);
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

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
    moduleId: string
  ) => {
    try {
      await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", moduleId);
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleId: string) => {
    try {
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      const issueIndex = this.issues[moduleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[moduleId].splice(issueIndex, 1);
        });
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleId: string) => {
    try {
      await this.rootIssueStore.projectIssues.archiveIssue(workspaceSlug, projectId, issueId);
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        pull(this.issues[moduleId], issueId);
      });
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
      if (quickAddIssueIndex >= 0) {
        runInAction(() => {
          this.issues[moduleId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });
      }

      const currentCycleId = data.cycle_id !== "" && data.cycle_id === "None" ? undefined : data.cycle_id;
      if (currentCycleId) {
        await this.rootStore.cycleIssues.addCycleToIssue(workspaceSlug, projectId, currentCycleId, response.id);
      }

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  addIssuesToModule = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) => {
    try {
      // add the new issue ids to the module issues map
      runInAction(() => {
        update(this.issues, moduleId, (moduleIssueIds = []) => {
          if (!moduleIssueIds) return [...issueIds];
          else return uniq(concat(moduleIssueIds, issueIds));
        });
      });
      // update the root issue map with the new module ids
      issueIds.forEach((issueId) => {
        update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) => {
          if (issueModuleIds.includes(moduleId)) return issueModuleIds;
          else return uniq(concat(issueModuleIds, [moduleId]));
        });
      });

      await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
    } catch (error) {
      issueIds.forEach((issueId) => {
        runInAction(() => {
          // remove the new issue ids from the module issues map
          pull(this.issues[moduleId], issueId);
          // remove the new module ids from the root issue map
          update(this.rootStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
            pull(issueModuleIds, moduleId)
          );
        });
      });
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
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * change modules array in issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param addModuleIds array of modules to be added
   * @param removeModuleIds array of modules to be removed
   */
  changeModulesInIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => {
    // keep a copy of the original module ids
    const originalModuleIds = this.rootStore.issues.issuesMap[issueId]?.module_ids
      ? [...this.rootStore.issues.issuesMap[issueId].module_ids!]
      : [];
    try {
      runInAction(() => {
        // remove the new issue id to the module issues map
        removeModuleIds.forEach((moduleId) => {
          update(this.issues, moduleId, (moduleIssueIds = []) => {
            if (moduleIssueIds.includes(issueId)) return pull(moduleIssueIds, issueId);
            else return moduleIssueIds;
          });
        });
        // add the new issue id to the module issues map
        addModuleIds.forEach((moduleId) => {
          update(this.issues, moduleId, (moduleIssueIds = []) => {
            if (moduleIssueIds.includes(issueId)) return moduleIssueIds;
            else return uniq(concat(moduleIssueIds, [issueId]));
          });
        });
      });
      if (originalModuleIds) {
        // update the root issue map with the new module ids
        let currentModuleIds = concat([...originalModuleIds], addModuleIds);
        currentModuleIds = pull(currentModuleIds, ...removeModuleIds);
        this.rootStore.issues.updateIssue(issueId, { module_ids: uniq(currentModuleIds) });
      }

      //Perform API call
      await this.moduleService.addModulesToIssue(workspaceSlug, projectId, issueId, {
        modules: addModuleIds,
        removed_modules: removeModuleIds,
      });
    } catch (error) {
      // revert the issue back to its original module ids
      set(this.rootStore.issues.issuesMap, [issueId, "module_ids"], originalModuleIds);
      // add the removed issue id to the module issues map
      addModuleIds.forEach((moduleId) => {
        update(this.issues, moduleId, (moduleIssueIds = []) => {
          if (moduleIssueIds.includes(issueId)) return pull(moduleIssueIds, issueId);
          else return moduleIssueIds;
        });
      });
      // remove the added issue id to the module issues map
      removeModuleIds.forEach((moduleId) => {
        update(this.issues, moduleId, (moduleIssueIds = []) => {
          if (moduleIssueIds.includes(issueId)) return moduleIssueIds;
          else return uniq(concat(moduleIssueIds, [issueId]));
        });
      });

      throw error;
    }
  };
}

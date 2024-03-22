import concat from "lodash/concat";
import pull from "lodash/pull";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// base class
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
// services
import { ModuleService } from "services/module.service";
// types
import { TIssue, TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse } from "@plane/types";
import { IIssueRootStore } from "../root.store";
import { IModuleIssuesFilter } from "./filter.store";

export interface IModuleIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    moduleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    moduleId: string
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>, moduleId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;

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
  addModulesToIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<void>;
  removeModulesFromIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => Promise<void>;
}

export class ModuleIssues extends BaseIssuesStore implements IModuleIssues {
  moduleId: string | undefined = undefined;
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // service
  moduleService;
  // filter store
  issueFilterStore: IModuleIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IModuleIssuesFilter) {
    super(_rootStore, issueFilterStore);

    makeObservable(this, {
      // observable
      moduleId: observable.ref,
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,

      addIssuesToModule: action,
      removeIssuesFromModule: action,
      addModulesToIssue: action,
      removeModulesFromIssue: action,
      removeIssueFromModule: action,

      quickAddIssue: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
    // service
    this.moduleService = new ModuleService();
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    moduleId: string
  ) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();

      this.moduleId = moduleId;

      const params = this.issueFilterStore?.getFilterParams(options, undefined, undefined, undefined);
      const response = await this.moduleService.getModuleIssues(workspaceSlug, projectId, moduleId, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    groupId?: string,
    subGroupId?: string
  ) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      this.loader = "pagination";

      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        cursorObject?.nextCursor,
        groupId,
        subGroupId
      );
      const response = await this.moduleService.getModuleIssues(workspaceSlug, projectId, moduleId, params);

      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    moduleId: string
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions, moduleId);
  };

  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, moduleId: string) => {
    try {
      const response = await super.createIssue(workspaceSlug, projectId, data, moduleId, false);
      await this.addIssuesToModule(workspaceSlug, projectId, moduleId, [response.id], false);
      this.moduleId === moduleId && this.addIssue(response);

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
      await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      runInAction(() => {
        this.moduleId === moduleId && issueIds.forEach((issueId) => this.addIssueToList(issueId));
      });

      issueIds.forEach((issueId) => {
        update(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) => {
          if (issueModuleIds.includes(moduleId)) return issueModuleIds;
          else return uniq(concat(issueModuleIds, [moduleId]));
        });
      });

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
    } catch (error) {
      throw error;
    }
  };

  removeIssuesFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
    try {
      const response = await this.moduleService.removeIssuesFromModuleBulk(
        workspaceSlug,
        projectId,
        moduleId,
        issueIds
      );

      runInAction(() => {
        this.moduleId === moduleId && issueIds.forEach((issueId) => this.removeIssueFromList(issueId));
      });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          update(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) => {
            if (issueModuleIds.includes(moduleId)) return pull(issueModuleIds, moduleId);
            else return uniq(concat(issueModuleIds, [moduleId]));
          });
        });
      });

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

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
          this.moduleId === moduleId && this.addIssueToList(issueId);
        });
        update(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
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
          this.moduleId === moduleId && this.removeIssueFromList(issueId);
          update(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
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
        this.moduleId === this.moduleId && this.removeIssueFromList(issueId);
        update(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"], (issueModuleIds = []) =>
          pull(issueModuleIds, moduleId)
        );
      });

      const response = await this.moduleService.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue = this.issueQuickAdd;
}

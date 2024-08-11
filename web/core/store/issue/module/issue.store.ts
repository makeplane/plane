import { action, makeObservable, runInAction } from "mobx";
// base class
import {
  TIssue,
  TLoader,
  ViewFlags,
  IssuePaginationOptions,
  TIssuesResponse,
  TBulkOperationsPayload,
} from "@plane/types";
// helpers
import { getDistributionPathsPostUpdate } from "@/helpers/distribution-update.helper";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
//
import { IIssueRootStore } from "../root.store";
import { IModuleIssuesFilter } from "./filter.store";
import { issueDB } from "@/db/local.index";

export interface IModuleIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader, moduleId: string) => Promise<TIssue[]>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>, moduleId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    moduleId: string
  ) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class ModuleIssues extends BaseIssuesStore implements IModuleIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // filter store
  issueFilterStore: IModuleIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IModuleIssuesFilter) {
    super(_rootStore, issueFilterStore);

    makeObservable(this, {
      // action
      fetchIssues: action,

      quickAddIssue: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  /**
   * Fetches the module details
   * @param workspaceSlug
   * @param projectId
   * @param id is the module Id
   */
  fetchParentStats = (workspaceSlug: string, projectId?: string | undefined, id?: string | undefined) => {
    const moduleId = id ?? this.moduleId;
    projectId &&
      moduleId &&
      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
  };

  /**
   * Update Parent stats before fetching from server
   * @param prevIssueState
   * @param nextIssueState
   * @param id
   */
  updateParentStats = (prevIssueState?: TIssue, nextIssueState?: TIssue, id?: string | undefined) => {
    // get distribution updates
    const distributionUpdates = getDistributionPathsPostUpdate(
      prevIssueState,
      nextIssueState,
      this.rootIssueStore.rootStore.state.stateMap,
      this.rootIssueStore.rootStore.projectEstimate?.currentActiveEstimate?.estimatePointById
    );

    const moduleId = id ?? this.moduleId;

    moduleId && this.rootIssueStore.rootStore.module.updateModuleDistribution(distributionUpdates, moduleId);
  };

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @param options
   * @param moduleId
   * @returns
   */
  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader, moduleId: string) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });
      if (loadType === "init-loader") this.clear();

      const response = await issueDB.getIssues(workspaceSlug, projectId, this.issueFilterStore.issueFilters);

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response);
      return response;
    } catch (error) {
      // set loader to undefined once errored out
      this.setLoader(undefined);
      throw error;
    }
  };

  /**
   * Override inherited create issue, to also add issue to module
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param moduleId
   * @returns
   */
  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, moduleId: string) => {
    try {
      const response = await super.createIssue(workspaceSlug, projectId, data, moduleId, false);
      const moduleIds = data.module_ids && data.module_ids.length > 1 ? data.module_ids : [moduleId];
      await this.addModulesToIssue(workspaceSlug, projectId, response.id, moduleIds);

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * This Method overrides the base quickAdd issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param moduleId
   * @returns
   */
  quickAddIssue = async (workspaceSlug: string, projectId: string, data: TIssue, moduleId: string) => {
    try {
      // add temporary issue to store list
      this.addIssue(data);

      // call overridden create issue
      const response = await this.createIssue(workspaceSlug, projectId, data, moduleId);

      // remove temp Issue from store list
      runInAction(() => {
        this.removeIssueFromList(data.id);
        this.rootIssueStore.issues.removeIssue(data.id);
      });

      const currentCycleId = data.cycle_id !== "" && data.cycle_id === "None" ? undefined : data.cycle_id;

      if (currentCycleId) {
        await this.addCycleToIssue(workspaceSlug, projectId, currentCycleId, response.id);
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;
}

import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TIssueType } from "@plane/types";
// services
import { IssueTypeService } from "@/services/issue";
// store
import { CoreRootStore } from "./root.store";

export interface IIssueTypeStore {
  // Observable
  issueTypeMap: Record<string, TIssueType>;
  fetchedMap: Record<string, boolean>;
  // Computed
  getIssueTypesForWorkspace: (workspaceSlug: string) => TIssueType[] | undefined;
  getIssueTypeById: (typeId: string) => TIssueType | null;
  // Action
  fetchWorkspaceIssueTypes: (workspaceSlug: string) => Promise<TIssueType[]>;
}

export class IssueTypeStore implements IIssueTypeStore {
  // root store
  rootStore;
  // root store issueTypeMap
  issueTypeMap: Record<string, TIssueType> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  // services
  issueTypeService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      issueTypeMap: observable,
      fetchedMap: observable,
      // computed
      getIssueTypesForWorkspace: computed,
      // actions
      fetchWorkspaceIssueTypes: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.issueTypeService = new IssueTypeService();
  }

  /**
   * Returns the issue types for a specific workspace
   * @param workspaceSlug
   */
  get getIssueTypesForWorkspace() {
    return computedFn((workspaceSlug: string) => {
      if (!this.fetchedMap[workspaceSlug]) return undefined;
      return Object.values(this.issueTypeMap).filter(
        (issueType) => issueType.id && this.issueTypeMap[issueType.id]
      );
    });
  }

  /**
   * Get issue type info from the map using issue type id
   * @param typeId
   */
  getIssueTypeById = computedFn((typeId: string): TIssueType | null => this.issueTypeMap?.[typeId] || null);

  /**
   * Fetches all the issue types for a specific workspace
   * @param workspaceSlug
   * @returns Promise<TIssueType[]>
   */
  fetchWorkspaceIssueTypes = async (workspaceSlug: string) =>
    await this.issueTypeService.getWorkspaceIssueTypes(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((issueType) => {
          set(this.issueTypeMap, [issueType.id], issueType);
        });
        set(this.fetchedMap, workspaceSlug, true);
      });
      return response;
    });
}

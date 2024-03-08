import { action, makeObservable, runInAction } from "mobx";
// base class
import { TIssue, TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse } from "@plane/types";
// services
// types
import { IIssueRootStore } from "../root.store";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
import { IProjectViewIssuesFilter } from "./filter.store";

export interface IProjectViewIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (workspaceSlug: string, projectId: string) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
}

export class ProjectViewIssues extends BaseIssuesStore implements IProjectViewIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  //filter store
  issueFilterStore: IProjectViewIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectViewIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      // action
      fetchIssues: action,
    });
    //filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();
      const params = this.issueFilterStore?.getFilterParams(options);
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (workspaceSlug: string, projectId: string) => {
    if (!this.paginationOptions) return;
    try {
      this.loader = "pagination";

      const params = this.issueFilterStore?.getFilterParams(this.paginationOptions);
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      this.onfetchNexIssues(response);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (workspaceSlug: string, projectId: string, loadType: TLoader) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions);
  };
}

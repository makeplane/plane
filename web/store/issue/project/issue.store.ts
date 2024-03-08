// services
// types
import { action, makeObservable, runInAction } from "mobx";
// base class
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
// types
import { IIssueRootStore } from "../root.store";
import { TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse, TIssue } from "@plane/types";
import { IProjectIssuesFilter } from "./filter.store";

export interface IProjectIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // action
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    option: IssuePaginationOptions
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

export class ProjectIssues extends BaseIssuesStore implements IProjectIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };

  // filter store
  issueFilterStore: IProjectIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
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

  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "mutation"
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions);
  };
}

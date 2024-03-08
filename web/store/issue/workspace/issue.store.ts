import { action, makeObservable, runInAction } from "mobx";
// base class
import { WorkspaceService } from "services/workspace.service";
import { IssuePaginationOptions, TIssue, TIssuesResponse, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";
// services
// types
import { IIssueRootStore } from "../root.store";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
import { IWorkspaceIssuesFilter } from "./filter.store";

export interface IWorkspaceIssues extends IBaseIssuesStore {
  // observable
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    viewId: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    viewId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (workspaceSlug: string, viewId: string) => Promise<TIssuesResponse | undefined>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
}

export class WorkspaceIssues extends BaseIssuesStore implements IWorkspaceIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // service
  workspaceService;
  // filterStore
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IWorkspaceIssuesFilter) {
    super(_rootStore, issueFilterStore);

    makeObservable(this, {
      // action
      fetchIssues: action,
    });
    // services
    this.workspaceService = new WorkspaceService();
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (workspaceSlug: string, viewId: string, loadType: TLoader, options: IssuePaginationOptions) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();
      const params = this.issueFilterStore?.getFilterParams(viewId, options, undefined);
      const response = await this.workspaceService.getViewIssues(workspaceSlug, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (workspaceSlug: string, viewId: string) => {
    if (!this.paginationOptions) return;
    try {
      this.loader = "pagination";

      const params = this.issueFilterStore?.getFilterParams(viewId, this.paginationOptions, this.nextCursor);
      const response = await this.workspaceService.getViewIssues(workspaceSlug, params);

      this.onfetchNexIssues(response);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (workspaceSlug: string, viewId: string, loadType: TLoader) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, viewId, loadType, this.paginationOptions);
  };
}

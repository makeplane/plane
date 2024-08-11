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
// services
// types
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
import { IIssueRootStore } from "../root.store";
import { IProjectViewIssuesFilter } from "./filter.store";
import { issueDB } from "@/db/local.index";

export interface IProjectViewIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, viewId: string, loadType: TLoader) => Promise<TIssue[]>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
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

  fetchParentStats = async () => {};

  /** */
  updateParentStats = () => {};

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @param options
   * @returns
   */
  fetchIssues = async (workspaceSlug: string, projectId: string, viewId: string, loadType: TLoader) => {
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
      // set loader to undefined if errored out
      this.setLoader(undefined);
      throw error;
    }
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  quickAddIssue = this.issueQuickAdd;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;
}

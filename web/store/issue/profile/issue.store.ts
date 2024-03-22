import { action, observable, makeObservable, computed, runInAction } from "mobx";
// base class
import { UserService } from "services/user.service";
import { TIssue, TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse } from "@plane/types";
// services
// types
import { IIssueRootStore } from "../root.store";
import { IProfileIssuesFilter } from "./filter.store";
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";

export interface IProfileIssues extends IBaseIssuesStore {
  // observable
  currentView: "assigned" | "created" | "subscribed";
  viewFlags: ViewFlags;
  // actions
  setViewId: (viewId: "assigned" | "created" | "subscribed") => void;
  // action
  fetchIssues: (
    workspaceSlug: string,
    userId: string,
    loadType: TLoader,
    option: IssuePaginationOptions,
    view: "assigned" | "created" | "subscribed"
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    userId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    userId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  quickAddIssue: undefined;
}

export class ProfileIssues extends BaseIssuesStore implements IProfileIssues {
  currentView: "assigned" | "created" | "subscribed" = "assigned";
  // filter store
  issueFilterStore: IProfileIssuesFilter;
  // services
  userService;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProfileIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      // observable
      currentView: observable.ref,
      // computed
      viewFlags: computed,
      // action
      setViewId: action.bound,
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
    // services
    this.userService = new UserService();
  }

  get viewFlags() {
    if (this.currentView === "subscribed")
      return {
        enableQuickAdd: false,
        enableIssueCreation: false,
        enableInlineEditing: true,
      };
    return {
      enableQuickAdd: false,
      enableIssueCreation: true,
      enableInlineEditing: true,
    };
  }

  setViewId(viewId: "assigned" | "created" | "subscribed") {
    this.currentView = viewId;
  }

  fetchIssues = async (
    workspaceSlug: string,
    userId: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    view: "assigned" | "created" | "subscribed"
  ) => {
    try {
      runInAction(() => {
        this.loader = loadType;
      });
      this.clear();

      this.setViewId(view);

      let params = this.issueFilterStore?.getFilterParams(options, undefined, undefined, undefined);
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (this.currentView === "assigned") params = { ...params, assignees: userId };
      else if (this.currentView === "created") params = { ...params, created_by: userId };
      else if (this.currentView === "subscribed") params = { ...params, subscriber: userId };

      const response = await this.userService.getUserProfileIssues(workspaceSlug, userId, params);

      this.onfetchIssues(response, options);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchNextIssues = async (workspaceSlug: string, userId: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(subGroupId ?? groupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      this.loader = "pagination";

      let params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        cursorObject?.nextCursor,
        groupId,
        subGroupId
      );
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (this.currentView === "assigned") params = { ...params, assignees: userId };
      else if (this.currentView === "created") params = { ...params, created_by: userId };
      else if (this.currentView === "subscribed") params = { ...params, subscriber: userId };

      const response = await this.userService.getUserProfileIssues(workspaceSlug, userId, params);

      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (workspaceSlug: string, userId: string, loadType: TLoader) => {
    if (!this.paginationOptions || !this.currentView) return;
    return await this.fetchIssues(workspaceSlug, userId, loadType, this.paginationOptions, this.currentView);
  };

  quickAddIssue = undefined;
}

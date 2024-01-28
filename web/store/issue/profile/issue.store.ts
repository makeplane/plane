import { action, observable, makeObservable, computed, runInAction } from "mobx";
import set from "lodash/set";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// services
import { UserService } from "services/user.service";
// types
import { IIssueRootStore } from "../root.store";
import { TIssue, TLoader, TGroupedIssues, TSubGroupedIssues, TUnGroupedIssues, ViewFlags } from "@plane/types";

interface IProfileIssueTabTypes {
  assigned: string[];
  created: string[];
  subscribed: string[];
}

export interface IProfileIssues {
  // observable
  loader: TLoader;
  currentView: "assigned" | "created" | "subscribed";
  issues: { [userId: string]: IProfileIssueTabTypes };
  // computed
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    projectId: string | undefined,
    loadType: TLoader,
    userId?: string | undefined,
    view?: "assigned" | "created" | "subscribed"
  ) => Promise<TIssue[]>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    userId?: string | undefined
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    userId?: string | undefined
  ) => Promise<TIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    userId?: string | undefined
  ) => Promise<TIssue | undefined>;
  quickAddIssue: undefined;
}

export class ProfileIssues extends IssueHelperStore implements IProfileIssues {
  loader: TLoader = "init-loader";
  currentView: "assigned" | "created" | "subscribed" = "assigned";
  issues: { [userId: string]: IProfileIssueTabTypes } = {};
  quickAddIssue = undefined;
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  userService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observable
      loader: observable.ref,
      currentView: observable.ref,
      issues: observable,
      // computed
      groupedIssueIds: computed,
      viewFlags: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.userService = new UserService();
  }

  get groupedIssueIds() {
    const userId = this.rootIssueStore.userId;
    const currentView = this.currentView;
    if (!userId || !currentView) return undefined;

    const displayFilters = this.rootIssueStore?.profileIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const userIssueIds = this.issues[userId]?.[currentView];

    if (!userIssueIds) return;

    const _issues = this.rootStore.issues.getIssuesByIds(userIssueIds);
    if (!_issues) return undefined;

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, _issues);
      else issues = this.unGroupedIssues(orderBy, _issues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, _issues);
      else issues = this.groupedIssues(groupBy, orderBy, _issues);
    }

    return issues;
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

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string | undefined,
    loadType: TLoader = "init-loader",
    userId?: string | undefined,
    view?: "assigned" | "created" | "subscribed"
  ) => {
    try {
      if (!userId) throw new Error("user id is required");
      if (!view) throw new Error("current tab view is required");

      this.loader = loadType;
      this.currentView = view;

      let params: any = this.rootIssueStore?.profileIssuesFilter?.appliedFilters;
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

      runInAction(() => {
        set(
          this.issues,
          [userId, view],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    userId: string | undefined = undefined
  ) => {
    try {
      if (!userId) throw new Error("user id is required");

      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      runInAction(() => {
        this.issues[userId][this.currentView].push(response.id);
      });

      this.rootStore.issues.addIssue([response]);

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
    userId: string | undefined = undefined
  ) => {
    try {
      if (!userId) throw new Error("user id is required");

      this.rootStore.issues.updateIssue(issueId, data);
      const response = await this.rootIssueStore.projectIssues.updateIssue(
        workspaceSlug,
        projectId,
        data.id as keyof TIssue,
        data
      );

      return response;
    } catch (error) {
      if (this.currentView) this.fetchIssues(workspaceSlug, undefined, "mutation", userId, this.currentView);
      throw error;
    }
  };

  removeIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    userId: string | undefined = undefined
  ) => {
    if (!userId) return;
    try {
      const response = await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issueIndex = this.issues[userId][this.currentView].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[userId][this.currentView].splice(issueIndex, 1);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };
}

import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { UserService } from "services/user.service";
// types
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "../types";
import { RootStore } from "store/root";
import { IIssue } from "types";

export interface IProfileIssuesStore {
  // observable
  loader: TLoader;
  issues: { [user_id: string]: IIssueResponse } | undefined;
  currentUserId: string | null;
  currentUserIssueTab: "assigned" | "created" | "subscribed" | null;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    userId: string,
    type: "assigned" | "created" | "subscribed",
    loadType: TLoader
  ) => Promise<IIssueResponse>;
  createIssue: (workspaceSlug: string, userId: string, data: Partial<IIssue>) => Promise<IIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    userId: string,
    issueId: string,
    data: Partial<IIssue>
  ) => Promise<IIssue | undefined>;
  removeIssue: (
    workspaceSlug: string,
    userId: string,
    projectId: string,
    issueId: string
  ) => Promise<IIssue | undefined>;
  quickAddIssue: (workspaceSlug: string, userId: string, data: IIssue) => Promise<IIssue | undefined>;
}

export class ProfileIssuesStore extends IssueBaseStore implements IProfileIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [user_id: string]: IIssueResponse } | undefined = undefined;
  currentUserId: string | null = null;
  currentUserIssueTab: "assigned" | "created" | "subscribed" | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      currentUserId: observable.ref,
      currentUserIssueTab: observable.ref,
      // computed
      getIssues: computed,
      getIssuesIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      quickAddIssue: action,
    });

    this.rootStore = _rootStore;
    this.userService = new UserService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      if (!workspaceSlug || !this.currentUserId || !this.currentUserIssueTab) return;

      const userFilters = this.rootStore?.workspaceProfileIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, this.currentUserId, this.currentUserIssueTab, "mutation");
    });
  }

  get getIssues() {
    if (!this.currentUserId || !this.issues || !this.issues[this.currentUserId]) return undefined;

    return this.issues[this.currentUserId];
  }

  get getIssuesIds() {
    const currentUserId = this.currentUserId;
    const displayFilters = this.rootStore?.workspaceProfileIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!currentUserId || !this.issues || !this.issues[currentUserId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[currentUserId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[currentUserId]);
    }

    return issues;
  }

  fetchIssues = async (
    workspaceSlug: string,
    userId: string,
    type: "assigned" | "created" | "subscribed",
    loadType: TLoader = "init-loader"
  ) => {
    try {
      this.loader = loadType;
      this.currentUserId = userId;
      this.currentUserIssueTab = type;

      let params: any = this.rootStore?.workspaceProfileIssuesFilter?.appliedFilters;
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (type === "assigned") params = params ? { ...params, assignees: userId } : { assignees: userId };
      else if (type === "created") params = params ? { ...params, created_by: userId } : { created_by: userId };
      else if (type === "subscribed") params = params ? { ...params, subscriber: userId } : { subscriber: userId };

      const response = await this.userService.getV3UserProfileIssues(workspaceSlug, userId, params);

      const _issues = { ...this.issues, [userId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, userId: string, data: Partial<IIssue>) => {
    try {
      const projectId = data.project;
      const moduleId = data.module_id;
      const cycleId = data.cycle_id;

      if (!projectId) return;

      let response = {} as IIssue;
      response = await this.rootStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      if (moduleId)
        response = await this.rootStore.moduleIssues.addIssueToModule(workspaceSlug, projectId, moduleId, response);

      if (cycleId)
        response = await this.rootStore.cycleIssues.addIssueToCycle(workspaceSlug, projectId, cycleId, response);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = {};
      _issues[userId] = { ..._issues[userId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, this.currentUserIssueTab, "mutation");
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, userId: string, issueId: string, data: Partial<IIssue>) => {
    try {
      const projectId = data.project;
      const moduleId = data.module_id;
      const cycleId = data.cycle_id;

      if (!projectId) return;

      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = {};
      _issues[projectId][userId] = { ..._issues[projectId][userId], ...data };

      runInAction(() => {
        this.issues = _issues;
      });

      let response = data as IIssue | undefined;
      response = await this.rootStore.projectIssues.updateIssue(
        workspaceSlug,
        projectId,
        data.id as keyof IIssue,
        data
      );

      if (moduleId)
        response = await this.rootStore.moduleIssues.updateIssue(
          workspaceSlug,
          projectId,
          response.id as keyof IIssue,
          response,
          moduleId
        );

      if (cycleId)
        response = await this.rootStore.cycleIssues.updateIssue(
          workspaceSlug,
          projectId,
          data.id as keyof IIssue,
          data,
          cycleId
        );

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, this.currentUserIssueTab, "mutation");
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, userId: string, projectId: string, issueId: string) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = {};
      delete _issues?.[userId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.rootStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, this.currentUserIssueTab, "mutation");
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, userId: string, data: IIssue) => {
    try {
      const projectId = data.project;

      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = {};
      _issues[userId] = { ..._issues[userId], ...{ [data.id as keyof IIssue]: data } };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.rootStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      if (this.issues) {
        delete this.issues[userId][data.id as keyof IIssue];

        let _issues = { ...this.issues };
        if (!_issues) _issues = {};
        if (!_issues[userId]) _issues[userId] = {};
        _issues[userId] = { ..._issues[userId], ...{ [response.id as keyof IIssue]: response } };

        runInAction(() => {
          this.issues = _issues;
        });
      }

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, this.currentUserIssueTab, "mutation");
      throw error;
    }
  };
}

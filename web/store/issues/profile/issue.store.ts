import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { UserService } from "services/user.service";
// types
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues, ViewFlags } from "../types";
import { RootStore } from "store/root";
import { IIssue } from "types";

interface IProfileIssueTabTypes {
  assigned: IIssueResponse;
  created: IIssueResponse;
  subscribed: IIssueResponse;
}

export interface IProfileIssuesStore {
  // observable
  loader: TLoader;
  issues: { [user_id: string]: IProfileIssueTabTypes } | undefined;
  currentUserId: string | null;
  currentUserIssueTab: "assigned" | "created" | "subscribed" | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    userId: string,
    loadType: TLoader,
    id?: string | undefined,
    type?: "assigned" | "created" | "subscribed"
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
    projectId: string,
    issueId: string,
    userId?: string
  ) => Promise<IIssue | undefined>;
  quickAddIssue: (workspaceSlug: string, userId: string, data: IIssue) => Promise<IIssue | undefined>;
  viewFlags: ViewFlags;
}

export class ProfileIssuesStore extends IssueBaseStore implements IProfileIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [user_id: string]: IProfileIssueTabTypes } | undefined = undefined;
  currentUserId: string | null = null;
  currentUserIssueTab: "assigned" | "created" | "subscribed" | undefined = undefined;
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
      viewFlags: computed,
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
      if (userFilters) {
        this.fetchIssues(workspaceSlug, this.currentUserId, "mutation", this.currentUserIssueTab);
      }
    });
  }

  get getIssues() {
    if (!this.currentUserId || !this.currentUserIssueTab || !this.issues || !this.issues[this.currentUserId])
      return undefined;

    return this.issues[this.currentUserId][this.currentUserIssueTab];
  }

  get getIssuesIds() {
    const currentUserId = this.currentUserId;
    const displayFilters = this.rootStore?.workspaceProfileIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!currentUserId || !this.currentUserIssueTab || !this.issues || !this.issues[currentUserId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[currentUserId][this.currentUserIssueTab]);
      else issues = this.unGroupedIssues(orderBy, this.issues[currentUserId][this.currentUserIssueTab]);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy)
        issues = this.subGroupedIssues(
          subGroupBy,
          groupBy,
          orderBy,
          this.issues[currentUserId][this.currentUserIssueTab]
        );
      else issues = this.groupedIssues(groupBy, orderBy, this.issues[currentUserId][this.currentUserIssueTab]);
    }

    return issues;
  }

  get viewFlags() {
    if (this.currentUserIssueTab === "subscribed") {
      return {
        enableQuickAdd: false,
        enableIssueCreation: false,
        enableInlineEditing: true,
      };
    }

    return {
      enableQuickAdd: false,
      enableIssueCreation: true,
      enableInlineEditing: true,
    };
  }

  fetchIssues = async (
    workspaceSlug: string,
    userId: string,
    loadType: TLoader = "init-loader",
    id?: string | undefined,
    type?: "assigned" | "created" | "subscribed"
  ) => {
    try {
      this.loader = loadType;
      this.currentUserId = userId;
      if (type) this.currentUserIssueTab = type;

      let params: any = this.rootStore?.workspaceProfileIssuesFilter?.appliedFilters;
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (this.currentUserIssueTab === "assigned")
        params = params ? { ...params, assignees: userId } : { assignees: userId };
      else if (this.currentUserIssueTab === "created")
        params = params ? { ...params, created_by: userId } : { created_by: userId };
      else if (this.currentUserIssueTab === "subscribed")
        params = params ? { ...params, subscriber: userId } : { subscriber: userId };

      const response = await this.userService.getUserProfileIssues(workspaceSlug, userId, params);

      if (!this.currentUserIssueTab) return;

      const _issues: any = {
        ...this.issues,
        [userId]: {
          ...this.issues?.[userId],
          ...{ [this.currentUserIssueTab]: response },
        },
      };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return _issues;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, userId: string, data: Partial<IIssue>) => {
    try {
      const projectId = data.project;

      if (!projectId) return;

      let response = {} as IIssue;
      response = await this.rootStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = { assigned: {}, created: {}, subscribed: {} };
      _issues[userId] = { ..._issues[userId], ...{ [response.id]: response } };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, "mutation", this.currentUserIssueTab);
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, userId: string, issueId: string, data: Partial<IIssue>) => {
    try {
      const projectId = data.project;
      const moduleId = data.module_id;
      const cycleId = data.cycle_id;

      if (!projectId || !this.currentUserIssueTab) return;

      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = { assigned: {}, created: {}, subscribed: {} };
      _issues[userId][this.currentUserIssueTab][issueId] = {
        ..._issues[userId][this.currentUserIssueTab][issueId],
        ...data,
      };

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
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, "mutation", this.currentUserIssueTab);
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string, userId?: string) => {
    if (!userId) return;
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = { assigned: {}, created: {}, subscribed: {} };

      if (this.currentUserIssueTab) delete _issues?.[userId]?.[this.currentUserIssueTab]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.rootStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, "mutation", this.currentUserIssueTab);
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, userId: string, data: IIssue) => {
    try {
      const projectId = data.project;

      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[userId]) _issues[userId] = { assigned: {}, created: {}, subscribed: {} };
      _issues[userId] = { ..._issues[userId], ...{ [data.id as keyof IIssue]: data } };

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.rootStore.projectIssues.createIssue(workspaceSlug, projectId, data);

      if (this.issues && this.currentUserIssueTab) {
        delete this.issues[userId][this.currentUserIssueTab][data.id as keyof IIssue];

        let _issues = { ...this.issues };
        if (!_issues) _issues = {};
        if (!_issues[userId]) _issues[userId] = { assigned: {}, created: {}, subscribed: {} };
        _issues[userId] = { ..._issues[userId], ...{ [response.id as keyof IIssue]: response } };

        runInAction(() => {
          this.issues = _issues;
        });
      }

      return response;
    } catch (error) {
      if (this.currentUserIssueTab) this.fetchIssues(workspaceSlug, userId, "mutation", this.currentUserIssueTab);
      throw error;
    }
  };
}

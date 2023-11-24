import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueBaseStore } from "store/issues";
// services
import { UserService } from "services/user.service";
// types
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues } from "../types";
import { RootStore } from "store/root";

export interface IProfileIssuesStore {
  // observable
  loader: TLoader;
  issues: { [project_id: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  getIssuesIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<IIssueResponse>;
}

export class ProfileIssuesStore extends IssueBaseStore implements IProfileIssuesStore {
  loader: TLoader = "init-loader";
  issues: { [project_id: string]: IIssueResponse } | undefined = undefined;
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
      // computed
      getIssues: computed,
      getIssuesIds: computed,
      // action
      fetchIssues: action,
    });

    this.rootStore = _rootStore;
    this.userService = new UserService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      if (!workspaceSlug || !projectId) return;

      const userFilters = this.rootStore?.workspaceProfileIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, projectId, "mutation");
    });
  }

  get getIssues() {
    const projectId = this.rootStore?.project.projectId;
    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    return this.issues[projectId];
  }

  get getIssuesIds() {
    const projectId = this.rootStore?.project.projectId;
    const displayFilters = this.rootStore?.workspaceProfileIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[projectId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[projectId]);
    }

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.workspaceProfileIssuesFilter?.appliedFilters;
      const response = await this.userService.getV3UserProfileIssues(workspaceSlug, projectId, params);

      const _issues = { ...this.issues, [projectId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId);
      this.loader = undefined;
      throw error;
    }
  };
}

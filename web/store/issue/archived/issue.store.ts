import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
// base class
import { IssueHelperStore } from "../helpers/issue-helper.store";
// store
import { IIssueRootStore } from "../root.store";
// services
import { IssueArchiveService } from "services/issue";
// types
import { IIssueResponse, TLoader, IGroupedIssues, ISubGroupedIssues, TUnGroupedIssues, ViewFlags } from "types";

export interface IArchivedIssues {
  // observable
  loader: TLoader;
  issues: { [project_id: string]: IIssueResponse } | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  groupedIssueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string, loadType: TLoader) => Promise<IIssueResponse>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeIssueFromArchived: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  quickAddIssue: undefined;
  viewFlags: ViewFlags;
}

export class ArchivedIssues extends IssueHelperStore implements IArchivedIssues {
  loader: TLoader = "init-loader";
  issues: { [project_id: string]: IIssueResponse } | undefined = undefined;
  // root store
  rootStore;
  // service
  archivedIssueService;

  //viewData
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);

    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      getIssues: computed,
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      removeIssue: action,
      removeIssueFromArchived: action,
    });

    this.rootStore = _rootStore;
    this.archivedIssueService = new IssueArchiveService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspaceSlug;
      const projectId = this.rootStore.projectId;
      if (!workspaceSlug || !projectId) return;

      const userFilters = this.rootStore?.archivedIssuesFilter?.issueFilters?.filters;
      if (userFilters) this.fetchIssues(workspaceSlug, projectId, "mutation");
    });
  }

  get getIssues() {
    const projectId = this.rootStore.projectId;
    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    return this.issues[projectId];
  }

  get groupedIssueIds() {
    const projectId = this.rootStore.projectId;
    const displayFilters = this.rootStore?.archivedIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    let issues: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[projectId]);
      else issues = this.unGroupedIssues(orderBy, this.issues[projectId]);
    }

    return issues;
  }

  fetchIssues = async (workspaceSlug: string, projectId: string, loadType: TLoader = "init-loader") => {
    try {
      this.loader = loadType;

      const params = this.rootStore?.archivedIssuesFilter?.appliedFilters;
      const response = await this.archivedIssueService.getArchivedIssues(workspaceSlug, projectId, params);

      const _issues = { ...this.issues, [projectId]: { ...response } };

      runInAction(() => {
        this.issues = _issues;
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      console.error(error);
      this.loader = undefined;
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[projectId]) _issues[projectId] = {};
      delete _issues?.[projectId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.archivedIssueService.deleteArchivedIssue(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  removeIssueFromArchived = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      let _issues = { ...this.issues };
      if (!_issues) _issues = {};
      if (!_issues[projectId]) _issues[projectId] = {};
      delete _issues?.[projectId]?.[issueId];

      runInAction(() => {
        this.issues = _issues;
      });

      const response = await this.archivedIssueService.unarchiveIssue(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue: undefined;
}

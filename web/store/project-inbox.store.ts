import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
import includes from "lodash/includes";
import pull from "lodash/pull";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TInboxIssueFilterOptions, TInboxIssue, TIssue } from "@plane/types";
// root store
import { RootStore } from "./root.store";
import { uniq } from "lodash";

export interface IProjectInboxStore {
  isLoading: boolean;
  inboxIssues: Record<string, Record<string, TInboxIssue>>;
  inboxFilters: Record<string, TInboxIssueFilterOptions>;
  projectInboxIssues: TInboxIssue[] | undefined;
  projectInboxFilters: TInboxIssueFilterOptions | undefined;
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    params?: TInboxIssueFilterOptions
  ) => Promise<TInboxIssue[]>;
  createInboxIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TInboxIssue>;
  updateInboxIssuePriorityFilters: (projectId: string, key: string, value: string) => void;
  updateInboxIssueStatusFilters: (projectId: string, key: string, value: number) => void;
}

export class ProjectInboxStore implements IProjectInboxStore {
  isLoading: boolean = false;
  inboxIssues: Record<string, Record<string, TInboxIssue>> = {};
  inboxFilters: Record<string, TInboxIssueFilterOptions> = {};
  rootStore;
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      isLoading: observable.ref,
      inboxIssues: observable,
      inboxFilters: observable,
      // computed
      projectInboxIssues: computed,
      projectInboxFilters: computed,
      // actions
      fetchInboxIssues: action,
      createInboxIssue: action,
    });
    this.rootStore = _rootStore;
    this.inboxIssueService = new InboxIssueService();
  }

  /**
   * get project inbox issues from the project id in the router query
   */
  get projectInboxIssues() {
    const projectId = this.rootStore.app.router.query.projectId;
    if (!projectId) return;
    return Object.values(this.inboxIssues[projectId.toString()] || {});
  }

  /**
   * get project inbox filters from the project id in the router query
   */
  get projectInboxFilters() {
    const projectId = this.rootStore.app.router.query.projectId;
    if (!projectId) return;
    return this.inboxFilters[projectId.toString()];
  }

  /**
   * fetch inbox issues
   * @param workspaceSlug
   * @param projectId
   * @param params
   * @returns
   */
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, params = {}) => {
    runInAction(() => {
      this.isLoading = true;
    });
    const response = await this.inboxIssueService.list(workspaceSlug, projectId, params);
    runInAction(() => {
      this.inboxIssues[projectId] = keyBy(response, "id");
      this.isLoading = false;
    });
    return response;
  };

  /**
   * create inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createInboxIssue = async (workspaceSlug: string, projectId: string, data: Partial<TInboxIssue>) => {
    const response = await this.inboxIssueService.create(workspaceSlug, projectId, data);
    runInAction(() => {
      this.inboxIssues[projectId][response.id] = response;
    });
    return response;
  };

  /**
   * delete inbox issue
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   * @returns
   */
  deleteInboxIssue = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
    const response = await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId);
    runInAction(() => {
      delete this.inboxIssues[projectId][inboxIssueId];
    });
    return response;
  };

  /**
   * update inbox issue priority filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssuePriorityFilters = (projectId: string, key: string, value: string) => {
    if (!this.rootStore.app.router.query.workspaceSlug) return;
    runInAction(() => {
      const priorityList = this.inboxFilters[projectId]?.priority ?? [];
      if (includes(priorityList, value)) {
        pull(priorityList, value);
      } else {
        priorityList.push(value);
        this.inboxFilters[projectId] = {
          ...this.inboxFilters[projectId],
          priority: uniq(priorityList),
        };
      }
    });
    this.fetchInboxIssues(
      this.rootStore.app.router.query.workspaceSlug.toString(),
      projectId,
      this.inboxFilters[projectId]
    );
  };

  /**
   * update inbox issue status filters
   * @param projectId
   * @param key
   * @param value
   */
  updateInboxIssueStatusFilters = (projectId: string, key: string, value: number) => {
    runInAction(() => {
      const inboxStatusFilter = this.inboxFilters[projectId]?.inbox_status ?? [];
      if (includes(inboxStatusFilter, value)) {
        pull(inboxStatusFilter, value);
      } else {
        inboxStatusFilter.push(value);
        this.inboxFilters[projectId] = {
          ...this.inboxFilters[projectId],
          inbox_status: uniq(inboxStatusFilter),
        };
      }
    });
  };
}

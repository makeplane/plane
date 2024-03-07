import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TInboxIssueFilterOptions, TInboxIssue } from "@plane/types";
// root store
import { RootStore } from "./root.store";

export interface IProjectInboxStore {
  inboxIssues: Record<string, TInboxIssue>;
  projectInboxIssues: TInboxIssue[] | undefined;
  fetchInboxIssues: (workspaceSlug: string, projectId: string, params?: TInboxIssueFilterOptions) => Promise<any>;
}

export class ProjectInboxStore implements IProjectInboxStore {
  inboxIssues: Record<string, TInboxIssue> = {};
  rootStore;
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      inboxIssues: observable,
      // computed
      projectInboxIssues: computed,
      // actions
      fetchInboxIssues: action,
    });
    this.rootStore = _rootStore;
    this.inboxIssueService = new InboxIssueService();
  }

  get projectInboxIssues() {
    const projectId = this.rootStore.app.router.query.projectId;
    if (!projectId) return;
    return Object.values(this.inboxIssues).filter((issue) => issue.project === projectId);
  }

  fetchInboxIssues = async (workspaceSlug: string, projectId: string, params = {}) => {
    const response = await this.inboxIssueService.fetchInboxIssues(workspaceSlug, projectId, params);
    console.log("fetchInboxIssues", response);
    runInAction(() => {
      this.inboxIssues = keyBy(response, "id");
    });
    return response;
  };
}

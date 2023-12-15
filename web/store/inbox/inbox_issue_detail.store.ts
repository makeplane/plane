import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { InboxService } from "services/inbox.service";
// types
import { IInboxIssue, IIssue, TInboxStatus } from "types";
// constants
import { INBOX_ISSUE_SOURCE } from "constants/inbox";

export interface IInboxIssueDetailsStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  issueDetails: {
    [issueId: string]: IInboxIssue;
  };

  // actions
  fetchIssueDetails: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string
  ) => Promise<IInboxIssue>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    data: Partial<IIssue>
  ) => Promise<IInboxIssue>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: Partial<IInboxIssue>
  ) => Promise<void>;
  updateIssueStatus: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: TInboxStatus
  ) => Promise<void>;
  deleteIssue: (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => Promise<void>;
}

export class InboxIssueDetailsStore implements IInboxIssueDetailsStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  issueDetails: { [issueId: string]: IInboxIssue } = {};

  // root store
  rootStore;

  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      issueDetails: observable.ref,

      // actions
      fetchIssueDetails: action,
      createIssue: action,
      updateIssueStatus: action,
      deleteIssue: action,
    });

    this.rootStore = _rootStore;
    this.inboxService = new InboxService();
  }

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const issueResponse = await this.inboxService.getInboxIssueById(workspaceSlug, projectId, inboxId, issueId);

      runInAction(() => {
        this.loader = false;
        this.issueDetails = {
          ...this.issueDetails,
          [issueId]: issueResponse,
        };
      });

      return issueResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<IIssue>) => {
    const payload = {
      issue: {
        name: data.name,
        description: data.description,
        description_html: data.description_html,
        priority: data.priority,
      },
      source: INBOX_ISSUE_SOURCE,
    };

    try {
      const response = await this.inboxService.createInboxIssue(workspaceSlug, projectId, inboxId, payload);

      runInAction(() => {
        this.issueDetails = {
          ...this.issueDetails,
          [response.id]: response,
        };
        this.rootStore.inboxIssues.inboxIssues = {
          ...this.rootStore.inboxIssues.inboxIssues,
          [inboxId]: [response, ...this.rootStore.inboxIssues.inboxIssues[inboxId]],
        };
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: Partial<IInboxIssue>
  ) => {
    const updatedIssue = { ...this.issueDetails[issueId], ...data };

    try {
      runInAction(() => {
        this.issueDetails = {
          ...this.issueDetails,
          [issueId]: updatedIssue,
        };
        this.rootStore.inboxIssues.inboxIssues = {
          ...this.rootStore.inboxIssues.inboxIssues,
          [inboxId]: this.rootStore.inboxIssues.inboxIssues[inboxId].map((issue) => {
            if (issue.issue_inbox[0].id === issueId) return updatedIssue;

            return issue;
          }),
        };
      });

      await this.inboxService.patchInboxIssue(workspaceSlug, projectId, inboxId, issueId, { issue: data });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxIssues.fetchInboxIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };

  updateIssueStatus = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    issueId: string,
    data: TInboxStatus
  ) => {
    const updatedIssue = { ...this.issueDetails[issueId] };
    updatedIssue.issue_inbox[0] = {
      ...updatedIssue.issue_inbox[0],
      ...data,
    };

    try {
      runInAction(() => {
        this.issueDetails = {
          ...this.issueDetails,
          [issueId]: updatedIssue,
        };
        this.rootStore.inboxIssues.inboxIssues = {
          ...this.rootStore.inboxIssues.inboxIssues,
          [inboxId]: this.rootStore.inboxIssues.inboxIssues[inboxId].map((issue) => {
            if (issue.issue_inbox[0].id === issueId) return updatedIssue as IInboxIssue;

            return issue;
          }),
        };
      });

      await this.inboxService.markInboxStatus(workspaceSlug, projectId, inboxId, issueId, data);
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxIssues.fetchInboxIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };

  deleteIssue = async (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => {
    const updatedIssues = { ...this.issueDetails };
    delete updatedIssues[issueId];

    try {
      runInAction(() => {
        this.issueDetails = updatedIssues;
        this.rootStore.inboxIssues.inboxIssues = {
          ...this.rootStore.inboxIssues.inboxIssues,
          [inboxId]: this.rootStore.inboxIssues.inboxIssues[inboxId]?.filter(
            (issue) => issue.issue_inbox[0].id !== issueId
          ),
        };
      });

      await this.inboxService.deleteInboxIssue(workspaceSlug, projectId, inboxId, issueId);
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.rootStore.inboxIssues.fetchInboxIssues(workspaceSlug, projectId, inboxId);
      this.fetchIssueDetails(workspaceSlug, projectId, inboxId, issueId);

      throw error;
    }
  };
}

import { observable, action, makeObservable, runInAction, autorun, computed } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import update from "lodash/update";
// services
import { InboxIssueService } from "services/inbox/inbox-issue.service";
// types
import { RootStore } from "store/root.store";
import type {
  TInboxIssueDetailIdMap,
  TInboxIssueDetailMap,
  TInboxIssueDetail,
  TInboxIssueExtendedDetail,
  TInboxDetailedStatus,
  TIssue,
} from "@plane/types";
// constants
import { INBOX_ISSUE_SOURCE } from "constants/inbox";

export interface IInboxIssuesStore {
  // observables
  inboxIssues: TInboxIssueDetailIdMap;
  inboxIssueMap: TInboxIssueDetailMap;
  // helper methods
  getInboxIssuesByInboxId: (inboxId: string) => string[] | undefined;
  getInboxIssueById: (issueId: string) => TInboxIssueDetail | undefined;
  // actions
  fetchInboxIssues: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<TInboxIssueExtendedDetail[]>;
  fetchInboxIssueById: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string
  ) => Promise<TInboxIssueExtendedDetail[]>;
  createInboxIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    data: Partial<TInboxIssueExtendedDetail>
  ) => Promise<TInboxIssueExtendedDetail>;
  updateInboxIssue: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: Partial<TInboxIssueExtendedDetail>
  ) => Promise<TInboxIssueExtendedDetail>;
  removeInboxIssue: (workspaceSlug: string, projectId: string, inboxId: string, issueId: string) => Promise<void>;
  updateInboxIssueStatus: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: TInboxDetailedStatus
  ) => Promise<TInboxIssueExtendedDetail>;
}

export class InboxIssuesStore implements IInboxIssuesStore {
  // observables
  inboxIssues: TInboxIssueDetailIdMap = {};
  inboxIssueMap: TInboxIssueDetailMap = {};
  // root store
  rootStore;
  // services
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      inboxIssues: observable,
      inboxIssueMap: observable,
      // actions
      fetchInboxIssues: action,
      fetchInboxIssueById: action,
      createInboxIssue: action,
      updateInboxIssue: action,
      removeInboxIssue: action,
      updateInboxIssueStatus: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxIssueService = new InboxIssueService();
  }

  // helper methods
  getInboxIssuesByInboxId = computedFn((inboxId: string) => {
    if (!inboxId) return undefined;
    return this.inboxIssues?.[inboxId] ?? undefined;
  });

  getInboxIssueById = computedFn((inboxIssueId: string) => {
    if (!inboxIssueId) return undefined;
    return this.inboxIssueMap[inboxIssueId] ?? undefined;
  });

  // actions
  fetchInboxIssues = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    const queryParams = this.rootStore.inboxRoot.inboxFilters.appliedFilters ?? {};

    try {
      const response = await this.inboxIssueService.fetchInboxIssues(workspaceSlug, projectId, inboxId, queryParams);
      this.rootStore.inboxRoot.rootStore.issue.issues.addIssue(response as TIssue[]);

      const _inboxIssueIds = response.map((inboxIssue) => inboxIssue.id);
      runInAction(() => {
        response.forEach((inboxIssue) => {
          set(this.inboxIssueMap, inboxIssue.id, inboxIssue);
        });
        set(this.inboxIssues, inboxId, _inboxIssueIds);
      });

      return response as TInboxIssueExtendedDetail[];
    } catch (error) {
      throw error;
    }
  };

  fetchInboxIssueById = async (workspaceSlug: string, projectId: string, inboxId: string, inboxIssueId: string) => {
    try {
      const response = await this.inboxIssueService.fetchInboxIssueById(
        workspaceSlug,
        projectId,
        inboxId,
        inboxIssueId
      );

      // runInAction(() => {
      //   set(this.inboxIssueMap, inboxId, response);
      //   update(this.inboxIssues, projectId, (inboxIds: string[] = []) => {
      //     if (inboxIds.includes(inboxId)) return inboxIds;
      //     return uniq(concat(inboxIds, inboxId));
      //   });
      // });

      return response;
    } catch (error) {
      throw error;
    }
  };
}

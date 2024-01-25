import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
import pull from "lodash/pull";
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

type TLoader = "init-loader" | "mutation" | undefined;

export interface IInboxIssue {
  // observables
  loader: TLoader;
  inboxIssues: TInboxIssueDetailIdMap;
  inboxIssueMap: TInboxIssueDetailMap;
  // helper methods
  getInboxIssuesByInboxId: (inboxId: string) => string[] | undefined;
  getInboxIssueByIssueId: (inboxId: string, issueId: string) => TInboxIssueDetail | undefined;
  // actions
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    loaderType?: TLoader
  ) => Promise<TInboxIssueExtendedDetail[]>;
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

export class InboxIssue implements IInboxIssue {
  // observables
  loader: TLoader = "init-loader";
  inboxIssues: TInboxIssueDetailIdMap = {};
  inboxIssueMap: TInboxIssueDetailMap = {};
  // root store
  rootStore;
  // services
  inboxIssueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
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

  getInboxIssueByIssueId = computedFn((inboxId: string, issueId: string) => {
    if (!inboxId) return undefined;
    return this.inboxIssueMap?.[inboxId]?.[issueId] ?? undefined;
  });

  // actions
  fetchInboxIssues = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    loaderType: TLoader = "init-loader"
  ) => {
    try {
      this.loader = loaderType;
      const queryParams = this.rootStore.inbox.inboxFilter.inboxAppliedFilters ?? {};

      const response = await this.inboxIssueService.fetchInboxIssues(workspaceSlug, projectId, inboxId, queryParams);

      runInAction(() => {
        response.forEach((_inboxIssue) => {
          const { ["issue_inbox"]: issueInboxDetail, ...issue } = _inboxIssue;
          this.rootStore.inbox.rootStore.issue.issues.addIssue([issue]);
          const { ["id"]: omittedId, ...inboxIssue } = issueInboxDetail[0];
          set(this.inboxIssueMap, [inboxId, _inboxIssue.id], inboxIssue);
        });
      });

      const _inboxIssueIds = response.map((inboxIssue) => inboxIssue.id);
      runInAction(() => {
        set(this.inboxIssues, inboxId, _inboxIssueIds);
        this.loader = undefined;
      });

      return response;
    } catch (error) {
      this.loader = undefined;
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

      runInAction(() => {
        const { ["issue_inbox"]: issueInboxDetail, ...issue } = response;
        this.rootStore.inbox.rootStore.issue.issues.updateIssue(issue.id, issue);
        const { ["id"]: omittedId, ...inboxIssue } = issueInboxDetail[0];
        set(this.inboxIssueMap, [inboxId, response.id], inboxIssue);
      });

      runInAction(() => {
        update(this.inboxIssues, inboxId, (inboxIssueIds: string[] = []) => {
          if (inboxIssueIds.includes(response.id)) return inboxIssueIds;
          return uniq(concat(inboxIssueIds, response.id));
        });
      });

      // fetching issue activity
      await this.rootStore.issue.issueDetail.fetchActivities(workspaceSlug, projectId, inboxIssueId);
      // fetching issue reaction
      await this.rootStore.issue.issueDetail.fetchReactions(workspaceSlug, projectId, inboxIssueId);
      return response as any;
    } catch (error) {
      throw error;
    }
  };

  createInboxIssue = async (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<TIssue>) => {
    try {
      const response = await this.inboxIssueService.createInboxIssue(workspaceSlug, projectId, inboxId, {
        source: "in-app",
        issue: data,
      });

      runInAction(() => {
        const { ["issue_inbox"]: issueInboxDetail, ...issue } = response;
        this.rootStore.inbox.rootStore.issue.issues.addIssue([issue]);
        const { ["id"]: omittedId, ...inboxIssue } = issueInboxDetail[0];
        set(this.inboxIssueMap, [inboxId, response.id], inboxIssue);
        update(this.rootStore.inbox.inbox.inboxMap, [inboxId, "pending_issue_count"], (count: number = 0) => count + 1);
      });

      runInAction(() => {
        update(this.inboxIssues, inboxId, (inboxIssueIds: string[] = []) => {
          if (inboxIssueIds.includes(response.id)) return inboxIssueIds;
          return uniq(concat(inboxIssueIds, response.id));
        });
      });

      await this.rootStore.issue.issueDetail.fetchActivities(workspaceSlug, projectId, response.id);
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateInboxIssue = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: Partial<TIssue>
  ) => {
    try {
      const response = await this.inboxIssueService.updateInboxIssue(workspaceSlug, projectId, inboxId, inboxIssueId, {
        issue: data,
      });

      runInAction(() => {
        const { ["issue_inbox"]: issueInboxDetail, ...issue } = response;
        this.rootStore.inbox.rootStore.issue.issues.updateIssue(issue.id, issue);
        const { ["id"]: omittedId, ...inboxIssue } = issueInboxDetail[0];
        set(this.inboxIssueMap, [inboxId, response.id], inboxIssue);
      });

      runInAction(() => {
        update(this.inboxIssues, inboxId, (inboxIssueIds: string[] = []) => {
          if (inboxIssueIds.includes(response.id)) return inboxIssueIds;
          return uniq(concat(inboxIssueIds, response.id));
        });
      });

      await this.rootStore.issue.issueDetail.fetchActivities(workspaceSlug, projectId, inboxIssueId);
      return response as any;
    } catch (error) {
      throw error;
    }
  };

  removeInboxIssue = async (workspaceSlug: string, projectId: string, inboxId: string, inboxIssueId: string) => {
    try {
      const response = await this.inboxIssueService.removeInboxIssue(workspaceSlug, projectId, inboxId, inboxIssueId);

      runInAction(() => {
        pull(this.inboxIssues[inboxId], inboxIssueId);
        delete this.inboxIssueMap[inboxId][inboxIssueId];
        this.rootStore.inbox.rootStore.issue.issues.removeIssue(inboxIssueId);
        update(this.rootStore.inbox.inbox.inboxMap, [inboxId, "pending_issue_count"], (count: number = 0) => count - 1);
      });

      await this.rootStore.issue.issueDetail.fetchActivities(workspaceSlug, projectId, inboxIssueId);
      return response as any;
    } catch (error) {
      throw error;
    }
  };

  updateInboxIssueStatus = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    inboxIssueId: string,
    data: TInboxDetailedStatus
  ) => {
    try {
      const response = await this.inboxIssueService.updateInboxIssueStatus(
        workspaceSlug,
        projectId,
        inboxId,
        inboxIssueId,
        data
      );

      const pendingStatus = -2;
      runInAction(() => {
        const { ["issue_inbox"]: issueInboxDetail, ...issue } = response;
        this.rootStore.inbox.rootStore.issue.issues.addIssue([issue]);
        const { ["id"]: omittedId, ...inboxIssue } = issueInboxDetail[0];
        set(this.inboxIssueMap, [inboxId, response.id], inboxIssue);
        update(this.rootStore.inbox.inbox.inboxMap, [inboxId, "pending_issue_count"], (count: number = 0) =>
          data.status === pendingStatus ? count + 1 : count - 1
        );
      });

      runInAction(() => {
        update(this.inboxIssues, inboxId, (inboxIssueIds: string[] = []) => {
          if (inboxIssueIds.includes(response.id)) return inboxIssueIds;
          return uniq(concat(inboxIssueIds, response.id));
        });
      });

      await this.rootStore.issue.issueDetail.fetchActivities(workspaceSlug, projectId, inboxIssueId);
      return response as any;
    } catch (error) {
      throw error;
    }
  };
}

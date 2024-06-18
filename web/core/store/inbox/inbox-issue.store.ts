import clone from "lodash/clone";
import set from "lodash/set";
import { makeObservable, observable, runInAction, action } from "mobx";
import { TIssue, TInboxIssue, TInboxIssueStatus, TInboxDuplicateIssueDetails } from "@plane/types";
// helpers
import { EInboxIssueStatus } from "@/helpers/inbox.helper";
// services
import { InboxIssueService } from "@/services/inbox";
import { IssueService } from "@/services/issue";
// store
import { CoreRootStore } from "../root.store";

export interface IInboxIssueStore {
  isLoading: boolean;
  id: string;
  status: TInboxIssueStatus;
  issue: Partial<TIssue>;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined;
  // actions
  updateInboxIssueStatus: (status: TInboxIssueStatus) => Promise<void>; // accept, decline
  updateInboxIssueDuplicateTo: (issueId: string) => Promise<void>; // connecting the inbox issue to the project existing issue
  updateInboxIssueSnoozeTill: (date: Date | undefined) => Promise<void>; // snooze the issue
  updateIssue: (issue: Partial<TIssue>) => Promise<void>; // updating the issue
  updateProjectIssue: (issue: Partial<TIssue>) => Promise<void>; // updating the issue
  fetchIssueActivity: () => Promise<void>; // fetching the issue activity
}

export class InboxIssueStore implements IInboxIssueStore {
  // observables
  isLoading: boolean = false;
  id: string;
  status: TInboxIssueStatus = EInboxIssueStatus.PENDING;
  issue: Partial<TIssue> = {};
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined = undefined;
  workspaceSlug: string;
  projectId: string;
  // services
  inboxIssueService;
  issueService;

  constructor(
    workspaceSlug: string,
    projectId: string,
    data: TInboxIssue,
    private store: CoreRootStore
  ) {
    this.id = data.id;
    this.status = data.status;
    this.issue = data?.issue;
    this.snoozed_till = data?.snoozed_till || undefined;
    this.duplicate_to = data?.duplicate_to || undefined;
    this.created_by = data?.created_by || undefined;
    this.duplicate_issue_detail = data?.duplicate_issue_detail || undefined;
    this.workspaceSlug = workspaceSlug;
    this.projectId = projectId;
    // services
    this.inboxIssueService = new InboxIssueService();
    this.issueService = new IssueService();
    // observable variables should be defined after the initialization of the values
    makeObservable(this, {
      id: observable,
      status: observable,
      issue: observable,
      snoozed_till: observable,
      duplicate_to: observable,
      duplicate_issue_detail: observable,
      created_by: observable,
      // actions
      updateInboxIssueStatus: action,
      updateInboxIssueDuplicateTo: action,
      updateInboxIssueSnoozeTill: action,
      updateIssue: action,
      updateProjectIssue: action,
      fetchIssueActivity: action,
    });
  }

  updateInboxIssueStatus = async (status: TInboxIssueStatus) => {
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
    };

    try {
      if (!this.issue.id) return;
      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: status,
      });
      runInAction(() => set(this, "status", inboxIssue?.status));
    } catch {
      runInAction(() => set(this, "status", previousData.status));
    }
  };

  updateInboxIssueDuplicateTo = async (issueId: string) => {
    const inboxStatus = EInboxIssueStatus.DUPLICATE;
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
      duplicate_to: this.duplicate_to,
      duplicate_issue_detail: this.duplicate_issue_detail,
    };
    try {
      if (!this.issue.id) return;
      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        duplicate_to: issueId,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "duplicate_to", inboxIssue?.duplicate_to);
        set(this, "duplicate_issue_detail", inboxIssue?.duplicate_issue_detail);
      });
    } catch {
      runInAction(() => {
        set(this, "status", previousData.status);
        set(this, "duplicate_to", previousData.duplicate_to);
        set(this, "duplicate_issue_detail", previousData.duplicate_issue_detail);
      });
    }
  };

  updateInboxIssueSnoozeTill = async (date: Date | undefined) => {
    const inboxStatus = date ? EInboxIssueStatus.SNOOZED : EInboxIssueStatus.PENDING;
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
      snoozed_till: this.snoozed_till,
    };
    try {
      if (!this.issue.id) return;
      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        snoozed_till: date ? new Date(date) : null,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "snoozed_till", inboxIssue?.snoozed_till);
      });
    } catch {
      runInAction(() => {
        set(this, "status", previousData.status);
        set(this, "snoozed_till", previousData.snoozed_till);
      });
    }
  };

  updateIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = clone(this.issue);
    try {
      if (!this.issue.id) return;
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, issue[issueKey]);
      });
      await this.inboxIssueService.updateIssue(this.workspaceSlug, this.projectId, this.issue.id, issue);
      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  updateProjectIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = clone(this.issue);
    try {
      if (!this.issue.id) return;
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, issue[issueKey]);
      });
      await this.issueService.patchIssue(this.workspaceSlug, this.projectId, this.issue.id, issue);
      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  fetchIssueActivity = async () => {
    try {
      if (!this.issue.id) return;
      await this.store.issue.issueDetail.fetchActivities(this.workspaceSlug, this.projectId, this.issue.id);
    } catch {
      console.error("Failed to fetch issue activity");
    }
  };
}

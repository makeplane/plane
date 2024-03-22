import { makeObservable, observable, runInAction, action } from "mobx";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TIssue, TInboxIssue, TInboxIssueStatus } from "@plane/types";

export interface IInboxIssueStore {
  id: string;
  status: TInboxIssueStatus;
  issue: TIssue;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  // actions
  fetchInboxIssue: () => Promise<TInboxIssue>;
  updateDuplicateTo: (issueId: string) => void;
  updateSnoozeTill: (date: Date) => void;
  updateStatus: (status: TInboxIssueStatus) => void;
  updateInboxIssue: (data: Partial<TInboxIssue>) => void;
  deleteInboxIssue: () => void;
}

export class InboxIssueStore implements IInboxIssueStore {
  // components helper observables
  isLoading: boolean = false;
  // inbox issue observables
  id: string;
  status: TInboxIssueStatus;
  issue: TIssue;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  workspaceSlug: string;
  projectId: string;
  // services
  inboxIssueService;

  constructor(workspaceSlug: string, projectId: string, data: TInboxIssue) {
    this.id = data.issue.id;
    this.status = data.status;
    this.issue = data.issue;
    this.snoozed_till = data?.snoozed_till ? new Date(data.snoozed_till) : undefined;
    this.duplicate_to = data?.duplicate_to || undefined;
    this.created_by = data?.created_by || undefined;
    this.workspaceSlug = workspaceSlug;
    this.projectId = projectId;
    // services
    this.inboxIssueService = new InboxIssueService();
    // observable variables should be defined after the initialization of the values
    makeObservable(this, {
      id: observable,
      status: observable,
      issue: observable,
      snoozed_till: observable,
      duplicate_to: observable,
      created_by: observable,
      // actions
      fetchInboxIssue: action,
      updateDuplicateTo: action,
      updateSnoozeTill: action,
      updateStatus: action,
      updateInboxIssue: action,
    });
  }

  fetchInboxIssue = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
      });
      // fetch inbox issue from the server
      const response = this.inboxIssueService.retrieve(this.workspaceSlug, this.projectId, this.id);
      runInAction(() => {
        this.isLoading = false;
      });
      return response;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  };

  updateDuplicateTo = async (issueId: string) => {
    runInAction(() => {
      this.duplicate_to = issueId;
    });
    await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.id, { duplicate_to: issueId });
  };

  updateSnoozeTill = async (date: Date) => {
    const oldValue = this.snoozed_till;
    try {
      runInAction(() => {
        this.snoozed_till = date;
      });
      await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.id, {
        status: 0,
        snoozed_till: date,
      });
    } catch (error) {
      runInAction(() => {
        this.snoozed_till = oldValue;
      });
      throw error;
    }
  };

  updateStatus = async (status: TInboxIssueStatus) => {
    const oldValue = this.status;
    try {
      runInAction(() => {
        this.status = status;
      });
      await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.id, { status: status });
    } catch (error) {
      runInAction(() => {
        this.status = oldValue;
      });
      throw error;
    }
  };

  updateInboxIssue = async (data: Partial<TIssue>) => {
    try {
      runInAction(() => {
        this.issue = { ...this.issue, ...data };
      });
      await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.id, { issue: this.issue });
    } catch (error) {
      throw error;
    }
  };

  deleteInboxIssue = async () => {
    try {
      await this.inboxIssueService.delete(this.workspaceSlug, this.projectId, this.id);
    } catch (error) {
      throw error;
    }
  };
}

import { makeObservable, observable, runInAction, action } from "mobx";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TIssue, TInboxIssue } from "@plane/types";
import { ca } from "date-fns/locale";

export interface IInboxIssueStore {
  id: string;
  status: number;
  issue: Partial<TIssue>;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  // actions
  fetchInboxIssue: () => Promise<TInboxIssue>;
  updateDuplicateTo: (issueId: string) => void;
  updateSnoozeTill: (date: Date) => void;
  updateStatus: (status: number) => void;
}

export class InboxIssueStore implements IInboxIssueStore {
  // components helper observables
  isLoading: boolean = false;
  // inbox issue observables
  id: string;
  status: number;
  issue: Partial<TIssue> = {};
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  workspaceSlug: string;
  projectId: string;
  // services
  inboxIssueService;

  constructor(workspaceSlug: string, projectId: string, data: TInboxIssue) {
    this.id = data.id;
    this.status = data.status;
    this.issue = data?.issue;
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
      await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.id, { snoozed_till: date });
    } catch (error) {
      runInAction(() => {
        this.snoozed_till = oldValue;
      });
      throw error;
    }
  };

  updateStatus = (status: number) => {
    this.status = status;
  };
}

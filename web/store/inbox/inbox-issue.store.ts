import { makeObservable, observable, runInAction, action } from "mobx";
// services
import { InboxIssueService } from "services/inbox";
// types
import { TIssue, TInboxIssue } from "@plane/types";

export interface IInboxIssueStore {
  isLoading: boolean;
  id: string;
  status: number;
  issue: Partial<TIssue>;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  // actions
  updateInboxIssueStatus: (inboxIssue: Partial<TInboxIssue>) => Promise<void>;
  updateIssue: (issue: Partial<TIssue>) => Promise<void>;
}

export class InboxIssueStore implements IInboxIssueStore {
  // observables
  isLoading: boolean = false;
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
      updateInboxIssueStatus: action,
      updateIssue: action,
    });
  }

  updateInboxIssueStatus = async (inboxIssue: Partial<TInboxIssue>) => {
    try {
      if (!this.issue.id) return;
      const inboxIssueStatus = await this.inboxIssueService.update(
        this.workspaceSlug,
        this.projectId,
        this.issue.id,
        inboxIssue
      );
      console.log("inboxIssueStatus", inboxIssueStatus);
    } catch {}
  };

  updateIssue = async (issue: Partial<TIssue>) => {
    try {
      if (!this.issue.id) return;
      const inboxIssueStatus = await this.inboxIssueService.updateIssue(
        this.workspaceSlug,
        this.projectId,
        this.issue.id,
        issue
      );
      console.log("inboxIssueStatus", inboxIssueStatus);
    } catch {}
  };
}

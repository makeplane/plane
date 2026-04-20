/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { clone, set } from "lodash-es";
import { makeObservable, observable, runInAction, action } from "mobx";
import type {
  TInboxIssue,
  TInboxIssueStatus,
  EInboxIssueSource,
  TIssue,
  TInboxDuplicateIssueDetails,
  IInboxIssueStore,
  TIntakeIssueExtended,
} from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";
// helpers
// services
import { InboxIssueService } from "@/services/inbox";
import { IssueService } from "@/services/issue";
// store
import type { CoreRootStore } from "../root.store";

export class InboxIssueStore implements IInboxIssueStore {
  // observables
  isLoading: boolean = false;
  id: string;
  status: TInboxIssueStatus = EInboxIssueStatus.PENDING;
  issue: (TIssue & TIntakeIssueExtended) | undefined = undefined;
  snoozed_till: Date | null = null;
  source: EInboxIssueSource | undefined;
  duplicate_to: string | undefined;
  created_by: string;
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
    this.snoozed_till = data?.snoozed_till || null;
    this.duplicate_to = data?.duplicate_to || "";
    this.created_by = data.created_by;
    this.source = data?.source || undefined;
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
      source: observable,
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
    const previousStatus = this.status;

    try {
      if (!this.issue?.id) return;

      const inboxIssue = await this.inboxIssueService.updateStatus(this.workspaceSlug, this.projectId, this.issue.id, {
        status: status,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);

        // Handle intake_count transitions
        if (previousStatus === EInboxIssueStatus.PENDING && inboxIssue.status !== EInboxIssueStatus.PENDING) {
          // Changed from PENDING to something else: decrement
          const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.intake_count ?? 0;
          set(
            this.store.projectRoot.project.projectMap,
            [this.projectId, "intake_count"],
            Math.max(0, currentCount - 1)
          );
        } else if (previousStatus !== EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.PENDING) {
          // Changed from something else to PENDING: increment
          const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.intake_count ?? 0;
          set(this.store.projectRoot.project.projectMap, [this.projectId, "intake_count"], currentCount + 1);
        }
      });

      // Update counts
      const currentTotalResults = this.store.projectInbox.inboxIssuePaginationInfo?.total_results ?? 0;
      const updatedCount = currentTotalResults > 0 ? currentTotalResults - 1 : currentTotalResults;
      set(this.store.projectInbox, ["inboxIssuePaginationInfo", "total_results"], updatedCount);

      // If issue accepted sync issue to local db
      if (status === EInboxIssueStatus.ACCEPTED) {
        const updatedIssue = { ...this.issue, ...inboxIssue.issue };
        this.store.issue.issues.addIssue([updatedIssue]);
      }
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
    const wasPending = this.status === EInboxIssueStatus.PENDING;
    try {
      if (!this.issue) return;
      const inboxIssue = await this.inboxIssueService.updateStatus(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        duplicate_to: issueId,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "duplicate_to", inboxIssue?.duplicate_to);
        set(this, "duplicate_issue_detail", inboxIssue?.duplicate_issue_detail);
        // Decrement intake_count if the issue was PENDING
        if (wasPending) {
          const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.intake_count ?? 0;
          set(
            this.store.projectRoot.project.projectMap,
            [this.projectId, "intake_count"],
            Math.max(0, currentCount - 1)
          );
        }
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
    const previousStatus = this.status;
    try {
      if (!this.issue?.id) return;
      const inboxIssue = await this.inboxIssueService.updateStatus(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        snoozed_till: date ? new Date(date) : null,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "snoozed_till", inboxIssue?.snoozed_till);
        // Handle intake_count transitions
        if (previousStatus === EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.SNOOZED) {
          const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.intake_count ?? 0;
          set(
            this.store.projectRoot.project.projectMap,
            [this.projectId, "intake_count"],
            Math.max(0, currentCount - 1)
          );
        } else if (previousStatus !== EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.PENDING) {
          const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.intake_count ?? 0;
          set(this.store.projectRoot.project.projectMap, [this.projectId, "intake_count"], currentCount + 1);
        }
      });
    } catch {
      runInAction(() => {
        set(this, "status", previousData.status);
        set(this, "snoozed_till", previousData.snoozed_till);
      });
    }
  };

  updateIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = this.issue;
    if (!inboxIssue) return;
    try {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(inboxIssue, issueKey, issue[issueKey]);
      });
      await this.inboxIssueService.updateIssue(this.workspaceSlug, this.projectId, inboxIssue.id, issue);
      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(inboxIssue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  updateProjectIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = clone(this.issue);
    if (!inboxIssue) return;
    try {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(inboxIssue, issueKey, issue[issueKey]);
      });
      await this.issueService.patchIssue(this.workspaceSlug, this.projectId, inboxIssue.id, issue);
      if (issue.cycle_id) {
        await this.store.issue.issueDetail.addIssueToCycle(this.workspaceSlug, this.projectId, issue.cycle_id, [
          inboxIssue.id,
        ]);
      }
      if (issue.module_ids) {
        await this.store.issue.issueDetail.changeModulesInIssue(
          this.workspaceSlug,
          this.projectId,
          inboxIssue.id,
          issue.module_ids,
          []
        );
      }

      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(inboxIssue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  fetchIssueActivity = async () => {
    try {
      if (!this.issue) return;
      await this.store.issue.issueDetail.fetchActivities(this.workspaceSlug, this.projectId, this.issue.id);
    } catch {
      console.error("Failed to fetch issue activity");
    }
  };
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable } from "mobx";
import type { TIssueWorkLog, TIssueServiceType } from "@plane/types";
import type { IIssueDetail as IIssueDetailCore } from "@/store/issue/issue-details/root.store";
import { IssueDetail as IssueDetailCore } from "@/store/issue/issue-details/root.store";
import type { IIssueRootStore } from "@/store/issue/root.store";
import type { IIssueWorkLogStore } from "./worklog.store";
import { IssueWorkLogStore } from "./worklog.store";

export interface IIssueDetail extends IIssueDetailCore {
  worklog: IIssueWorkLogStore;
  // delegating methods
  fetchWorklogs: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog[]>;
  createWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueWorkLog>
  ) => Promise<TIssueWorkLog>;
  updateWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorkLog>
  ) => Promise<TIssueWorkLog>;
  deleteWorklog: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
  startTimer: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog>;
  stopTimer: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data?: { description?: string }
  ) => Promise<TIssueWorkLog>;
  fetchActiveTimer: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog | null>;
  fetchUserActiveTimer: (workspaceSlug: string, force?: boolean) => Promise<TIssueWorkLog | null>;
}

export class IssueDetail extends IssueDetailCore implements IIssueDetail {
  worklog: IssueWorkLogStore;

  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    super(rootStore, serviceType);
    this.worklog = new IssueWorkLogStore();
    makeObservable(this, {
      worklog: observable,
    });
  }

  // worklogs
  fetchWorklogs = (workspaceSlug: string, projectId: string, issueId: string) =>
    this.worklog.fetchWorklogs(workspaceSlug, projectId, issueId);
  createWorklog = (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueWorkLog>) =>
    this.worklog.createWorklog(workspaceSlug, projectId, issueId, data);
  updateWorklog = (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorkLog>
  ) => this.worklog.updateWorklog(workspaceSlug, projectId, issueId, worklogId, data);
  deleteWorklog = (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) =>
    this.worklog.deleteWorklog(workspaceSlug, projectId, issueId, worklogId);
  startTimer = (workspaceSlug: string, projectId: string, issueId: string) =>
    this.worklog.startTimer(workspaceSlug, projectId, issueId);
  stopTimer = (workspaceSlug: string, projectId: string, issueId: string, data?: { description?: string }) =>
    this.worklog.stopTimer(workspaceSlug, projectId, issueId, data);
  fetchActiveTimer = (workspaceSlug: string, projectId: string, issueId: string) =>
    this.worklog.fetchActiveTimer(workspaceSlug, projectId, issueId);
  fetchUserActiveTimer = (workspaceSlug: string, force?: boolean) =>
    this.worklog.fetchUserActiveTimer(workspaceSlug, force);
}

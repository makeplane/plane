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

import type {
  Issue as IJiraIssue,
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version2/models/index.js";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { IPriorityConfig, IStateConfig, JiraComponent, JiraConfig, JiraSprint } from "@plane/etl/jira-server";
import { EJiraAuthenticationType, JiraV2Service } from "@plane/etl/jira-server";

import type { ExIssueAttachment, ExState } from "@plane/sdk";
import type { TImportJob, TWorkspaceCredential } from "@plane/types";

export const getTargetState = (job: TImportJob<JiraConfig>, sourceState: JiraState): ExState | undefined => {
  /* TODO: Gracefully handle the case */
  if (!job.config) {
    return undefined;
  }
  const stateConfig = job.config.state;
  // Assign the external source and external id from jira and return the target state
  const targetState = stateConfig.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = E_IMPORTER_KEYS.JIRA_SERVER;
      state.target_state.external_id = sourceState.id as string;
      return state;
    }
  });

  return targetState?.target_state;
};

export const getTargetAttachments = (
  _job: TImportJob<JiraConfig>,
  attachments?: JiraAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map(
      (attachment: JiraAttachment): Partial<ExIssueAttachment> => ({
        external_id: attachment.id ?? "",
        external_source: E_IMPORTER_KEYS.JIRA_SERVER,
        attributes: {
          name: attachment.filename ?? "Untitled",
          size: attachment.size ?? 0,
        },
        asset: attachment.content ?? "",
      })
    )
    .filter((attachment) => attachment !== undefined) as ExIssueAttachment[];

  return attachmentArray;
};

export const getTargetPriority = (job: TImportJob<JiraConfig>, sourcePriority: JiraPriority): string | undefined => {
  if (!job.config) {
    return undefined;
  }
  const priorityConfig = job.config.priority;
  const targetPriority = priorityConfig.find(
    (priority: IPriorityConfig) => priority.source_priority.name === sourcePriority.name
  );
  return targetPriority?.target_priority;
};

export const filterSprintsForIssues = (issues: IJiraIssue[], sprints: JiraSprint[]): any[] => {
  const issueIds = new Set(issues.map((issue) => issue.id));

  return sprints
    .filter((sprint) => sprint.issues.some((issue: IJiraIssue) => issueIds.has(issue.id)))
    .map((sprint) => ({
      ...sprint,
      issues: sprint.issues.filter((issue: IJiraIssue) => issueIds.has(issue.id)),
    }));
};

export const filterComponentsForIssues = (issues: IJiraIssue[], components: JiraComponent[]): JiraComponent[] => {
  const issueIds = new Set(issues.map((issue) => issue.id));
  return components
    .filter((component) => component.issues.some((issue: IJiraIssue) => issueIds.has(issue.id)))
    .map((component) => ({
      ...component,
      issues: component.issues.filter((issue: IJiraIssue) => issueIds.has(issue.id)),
    }));
};

export const createJiraClient = (
  job: TImportJob<JiraConfig>,
  credentials: Partial<TWorkspaceCredential>
): JiraV2Service => {
  if (!credentials.source_access_token || !credentials.source_hostname || !credentials.source_auth_email) {
    throw new Error(`Missing credentials in job config for job ${job.id}`);
  }

  const authenticationType =
    job.source === E_IMPORTER_KEYS.JIRA ? EJiraAuthenticationType.BASIC : EJiraAuthenticationType.PERSONAL_ACCESS_TOKEN;

  return new JiraV2Service({
    email: credentials.source_auth_email,
    patToken: credentials.source_access_token,
    hostname: credentials.source_hostname,
    authenticationType,
  });
};

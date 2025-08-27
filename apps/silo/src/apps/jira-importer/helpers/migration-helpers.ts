import {
  Issue as IJiraIssue,
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version3/models";
import { IPriorityConfig, IStateConfig, JiraComponent, JiraConfig, JiraSprint, JiraService } from "@plane/etl/jira";
import { ExIssueAttachment, ExState } from "@plane/sdk";
import { TImportJob, TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { getAPIClient } from "@/services/client";
import { jiraAuth } from "../auth/auth";
import { E_IMPORTER_KEYS } from "@plane/etl/core";

export const getTargetState = (job: TImportJob<JiraConfig>, sourceState: JiraState): ExState | undefined => {
  /* TODO: Gracefully handle the case */
  if (!job.config) {
    return undefined;
  }
  const stateConfig = job.config.state;
  // Assign the external source and external id from jira and return the target state
  const targetState = stateConfig.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = E_IMPORTER_KEYS.JIRA;
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
        external_source: E_IMPORTER_KEYS.JIRA,
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
): JiraService => {
  const refreshTokenCallback = async ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    const apiClient = getAPIClient();

    await apiClient.workspaceCredential.createWorkspaceCredential({
      source: E_IMPORTER_KEYS.JIRA,
      target_access_token: credentials.target_access_token,
      source_access_token: access_token,
      source_refresh_token: refresh_token,
      workspace_id: job.workspace_id,
      user_id: job.initiator_id,
    });
  };

  if (env.JIRA_OAUTH_ENABLED === "1") {
    if (!job.config?.resource || !job.config?.resource.id) {
      throw new Error(`Missing resource details in job config for job ${job.id}`);
    }

    return new JiraService({
      isPAT: false,
      accessToken: credentials.source_access_token!,
      refreshToken: credentials.source_refresh_token!,
      cloudId: job.config?.resource.id as string,
      refreshTokenFunc: jiraAuth.getRefreshToken.bind(jiraAuth),
      refreshTokenCallback: refreshTokenCallback,
    });
  } else {
    if (!credentials.source_access_token || !credentials.source_hostname || !credentials.source_auth_email) {
      throw new Error(`Missing credentials in job config for job ${job.id}`);
    }
    return new JiraService({
      isPAT: true,
      patToken: credentials.source_access_token!,
      hostname: credentials.source_hostname,
      userEmail: credentials.source_auth_email!,
    });
  }
};

import { TServiceCredentials, TJobWithConfig } from "@silo/core";
import { IPriorityConfig, IStateConfig, JiraComponent, JiraConfig, JiraSprint, JiraService } from "@silo/jira";
import { ExIssueAttachment, ExState } from "@plane/sdk";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId, getJobById, updateJob } from "@/db/query";
import {
  Issue as IJiraIssue,
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version3/models";
import { jiraAuth } from "../auth/auth";
import { env } from "@/env";

export async function getJobData(jobId: string): Promise<TJobWithConfig<JiraConfig>> {
  const [jobData] = await getJobById(jobId);
  if (!jobData) {
    throw new Error(`[${jobId.slice(0, 7)}] No job data or metadata found. Exiting...`);
  }
  validateJobData(jobData as TJobWithConfig<JiraConfig>, jobId);
  return jobData as TJobWithConfig<JiraConfig>;
}

export function validateJobData(jobData: TJobWithConfig<JiraConfig>, jobId: string): void {
  if (!jobData.workspace_id || !jobData.migration_type) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing workspace id. Exiting...`);
  }
  if (!jobData.initiator_id) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing initiator id. Exiting...`);
  }
  if (!jobData.config) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing job config. Exiting...`);
  }
}

export const getTargetState = (job: TJobWithConfig<JiraConfig>, sourceState: JiraState): ExState | undefined => {
  /* TODO: Gracefully handle the case */
  if (!job.config) {
    return undefined;
  }
  const stateConfig = job.config.meta.state;
  // Assign the external source and external id from jira and return the target state
  const targetState = stateConfig.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = "JIRA";
      state.target_state.external_id = sourceState.id as string;
      return state;
    }
  });

  return targetState?.target_state;
};

export const getTargetAttachments = (
  _job: TJobWithConfig<JiraConfig>,
  attachments?: JiraAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map(
      (attachment: JiraAttachment): Partial<ExIssueAttachment> => ({
        external_id: attachment.id ?? "",
        external_source: "JIRA",
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

export const getTargetPriority = (
  job: TJobWithConfig<JiraConfig>,
  sourcePriority: JiraPriority
): string | undefined => {
  if (!job.config) {
    return undefined;
  }
  const priorityConfig = job.config.meta.priority;
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

export const resetJobIfStarted = async (jobId: string, job: TJobWithConfig<JiraConfig>) => {
  if (job.start_time) {
    await updateJob(jobId, {
      total_batch_count: 0,
      completed_batch_count: 0,
      transformed_batch_count: 0,
      end_time: undefined,
      error: "",
    });
  }
};

export const getJobCredentials = async (job: TJobWithConfig<JiraConfig>): Promise<TServiceCredentials> => {
  const credentials = await getCredentialsByWorkspaceId(job.workspace_id!, job.initiator_id!, "JIRA");
  if (!credentials || credentials.length === 0) {
    throw new Error(`Credentials not available for job ${job.workspace_id}`);
  }
  return credentials[0] as TServiceCredentials;
};

export const createJiraClient = (
  job: TJobWithConfig<JiraConfig>,
  credentials: Partial<TServiceCredentials>
): JiraService => {
  const refreshTokenCallback = async ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    await createOrUpdateCredentials(job.workspace_id, job.initiator_id, {
      source_access_token: access_token,
      source_refresh_token: refresh_token,
      source: "JIRA",
    });
  };

  if (env.JIRA_OAUTH_ENABLED === "1") {
    if (!job.config?.meta.resource || !job.config?.meta.resource.id) {
      throw new Error(`Missing resource details in job config for job ${job.id}`);
    }

    return new JiraService({
      isPAT: false,
      accessToken: credentials.source_access_token!,
      refreshToken: credentials.source_refresh_token!,
      cloudId: job.config?.meta.resource.id as string,
      refreshTokenFunc: jiraAuth.getRefreshToken.bind(jiraAuth),
      refreshTokenCallback: refreshTokenCallback,
    });
  } else {
    if (!credentials.source_access_token || !credentials.source_hostname || !credentials.user_email) {
      throw new Error(`Missing credentials in job config for job ${job.id}`);
    }
    return new JiraService({
      isPAT: true,
      patToken: credentials.source_access_token!,
      hostname: credentials.source_hostname,
      userEmail: credentials.user_email!,
    });
  }
};

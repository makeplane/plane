import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createGitLabService, GitlabMergeRequestEvent, GitlabNote, GitLabService } from "@plane/etl/gitlab";
import { Client } from "@plane/sdk";
import { TWorkspaceCredential } from "@plane/types";
import { classifyMergeRequestEvent } from "@/apps/gitlab/helpers";
import { getGitlabConnectionDetails } from "@/apps/gitlab/helpers/connection-details";
import { GitlabConnectionDetails, GitlabEntityConnection } from "@/apps/gitlab/types";
import { env } from "@/env";
import { getReferredIssues, IssueReference, IssueWithReference } from "@/helpers/parser";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

const getConnectionAndCredentials = async (
  data: GitlabMergeRequestEvent
): Promise<[GitlabConnectionDetails, TWorkspaceCredential] | null> => {
  const connectionDetails = await getGitlabConnectionDetails(data);
  if (!connectionDetails) {
    logger.error(`[GITLAB] Connection details not found for project ${data.project.id}, skipping...`);
    return null;
  }

  const credentials = await apiClient.workspaceCredential.getWorkspaceCredential(
    connectionDetails.workspaceConnection.credential_id
  );
  if (!credentials) {
    logger.error(`[GITLAB] Credentials not found for project ${data.project.id}, skipping...`);
    return null;
  }

  return [connectionDetails, credentials];
};

const getTargetState = (data: GitlabMergeRequestEvent, entityConnection: any) => {
  const event = classifyMergeRequestEvent(data);

  if (!event) return null;

  const targetState = entityConnection.config.states.mergeRequestEventMapping[event];
  if (!targetState) {
    logger.error(`[GITLAB] Target state not found for event ${event}, skipping...`);
    return null;
  }
  return targetState;
};

const updateIssue = async (
  planeClient: Client,
  entityConnection: GitlabEntityConnection,
  reference: IssueReference,
  targetState: any,
  projectId: number,
  prTitle: string,
  prNumber: number,
  prUrl: string
): Promise<IssueWithReference | null> => {
  try {
    const issue = await planeClient.issue.getIssueByIdentifier(
      entityConnection.workspace_slug,
      reference.identifier,
      reference.sequence
    );

    await planeClient.issue.update(entityConnection.workspace_slug, issue.project, issue.id, {
      state: targetState.id,
    });

    // create link to the pull request to the issue
    const linkTitle = `[${prNumber}] ${prTitle}`;
    try {
      await planeClient.issue.createLink(entityConnection.workspace_slug, issue.project, issue.id, linkTitle, prUrl);
    } catch (error) {
      console.log(error);
    }

    logger.info(`[GITLAB] Issue ${reference.identifier} updated to state ${targetState.name} for project ${projectId}`);
    return { reference, issue };
  } catch (error) {
    logger.error(
      `[GITLAB] Error updating issue ${reference.identifier}-${reference.sequence} for project ${projectId}: ${error}`
    );
    return null;
  }
};

const createCommentBody = (
  issues: IssueWithReference[],
  nonClosingReferences: IssueReference[],
  workspaceConnection: any
) => {
  const commentPrefix = "Merge Request Linked with Plane Issues";
  let body = `${commentPrefix}\n\n`;

  const closingIssues = issues.filter(
    ({ reference }) =>
      !nonClosingReferences.some(
        (ref) => ref.identifier === reference.identifier && ref.sequence === reference.sequence
      )
  );

  const nonClosingIssues = issues.filter(({ reference }) =>
    nonClosingReferences.some((ref) => ref.identifier === reference.identifier && ref.sequence === reference.sequence)
  );

  for (const { reference, issue } of closingIssues) {
    body += `- [${reference.identifier}-${reference.sequence}] [${issue.name}](${env.APP_BASE_URL}/${workspaceConnection.workspaceSlug}/projects/${issue.project}/issues/${issue.id})\n`;
  }

  if (nonClosingIssues.length > 0) {
    body += `\n\nReferences\n\n`;
    for (const { reference, issue } of nonClosingIssues) {
      body += `- [${reference.identifier}-${reference.sequence}] [${issue.name}](${env.APP_BASE_URL}/${workspaceConnection.workspaceSlug}/projects/${issue.project}/issues/${issue.id})\n`;
    }
  }

  body += `\n\nComment Automatically Generated by [Plane](https://plane.so)\n`;
  return body;
};

const handleComment = async (
  gitlabService: GitLabService,
  projectId: number,
  mergeRequestIid: number,
  body: string
) => {
  const commentPrefix = "Merge Request Linked with Plane Issues";
  const existingComments = await gitlabService.getMergeRequestComments(projectId, mergeRequestIid);
  const existingComment = existingComments.find((comment: GitlabNote) => comment.body.startsWith(commentPrefix));

  if (existingComment) {
    await gitlabService.updateMergeRequestComment(projectId, mergeRequestIid, existingComment.id, body);
    logger.info(`[GITLAB] Updated comment for merge request ${mergeRequestIid} in project ${projectId}`);
  } else {
    await gitlabService.createMergeRequestComment(projectId, mergeRequestIid, body);
    logger.info(`[GITLAB] Created new comment for merge request ${mergeRequestIid} in project ${projectId}`);
  }
};

export const handleMergeRequest = async (data: GitlabMergeRequestEvent) => {
  try {
    const result = await getConnectionAndCredentials(data);
    if (!result) return;

    const [{ workspaceConnection, entityConnection, projectConnections }, credentials] = result;

    const { closingReferences, nonClosingReferences } = getReferredIssues(
      data.object_attributes.title,
      data.object_attributes.description
    );
    if (closingReferences.length === 0 && nonClosingReferences.length === 0) {
      logger.info(`[GITLAB] No issue references found for project ${data.project.id}, skipping...`);
      return;
    }

    const event = classifyMergeRequestEvent(data);
    if (!event) return;
    const referredIssues = ["MR_CLOSED", "MR_MERGED"].includes(event)
      ? closingReferences
      : [...closingReferences, ...nonClosingReferences];

    if (!workspaceConnection.target_hostname) {
      logger.error("Target hostname not found");
      return;
    }

    const planeClient = new Client({
      apiToken: credentials.target_access_token!,
      baseURL: workspaceConnection.target_hostname,
    });

    const refreshTokenCallback = async (access_token: string, refresh_token: string) => {
      await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_INTEGRATION_KEYS.GITLAB,
        target_access_token: credentials.target_access_token,
        source_access_token: access_token,
        source_refresh_token: refresh_token,
        workspace_id: workspaceConnection.workspace_id,
        user_id: credentials.user_id!,
      });
    };

    const gitlabService = createGitLabService(
      credentials.source_access_token!,
      credentials.source_refresh_token!,
      refreshTokenCallback,
      workspaceConnection.source_hostname!
    );

    // we need to get the plane project attached to referred issues and then get target state for each and then do the updates
    // get the exissues from identifiers it'll have the project attached
    // loop through the referred issues, check if it has a plane project attached and then update the state using project connection target state

    const allReferredIssues = await Promise.all(
      referredIssues.map(async (reference) => {
        const issue = await planeClient.issue.getIssueByIdentifier(
          entityConnection.workspace_slug,
          reference.identifier,
          reference.sequence
        );
        return { reference, issue };
      })
    );

    const updatedIssues = await Promise.all(
      allReferredIssues.map(async (referredIssue) => {
        const targetProject = projectConnections.find((project) => project.project_id === referredIssue.issue.project);
        if (targetProject) {
          const targetState = getTargetState(data, targetProject);
          if (!targetState) return null;
          return updateIssue(
            planeClient,
            entityConnection,
            referredIssue.reference,
            targetState,
            data.project.id,
            data.object_attributes.title,
            data.object_attributes.iid,
            data.object_attributes.url
          );
        }
        return null;
      })
    );

    const validIssues = updatedIssues.filter((issue): issue is IssueWithReference => issue !== null);

    if (validIssues.length > 0) {
      const body = createCommentBody(validIssues, nonClosingReferences, workspaceConnection);
      await handleComment(gitlabService, data.project.id, data.object_attributes.iid, body);
    }
  } catch (error: unknown) {
    logger.error(`[GITLAB] Error handling merge request: ${(error as Error)?.stack}`);
    throw error;
  }
};

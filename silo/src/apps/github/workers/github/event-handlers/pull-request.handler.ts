import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import { createGithubService, GithubPullRequestDedupPayload, GithubService } from "@plane/etl/github";
import { MergeRequestEvent } from "@plane/etl/gitlab";
import { Client, ExIssue, Client as PlaneClient } from "@plane/sdk";
import { classifyPullRequestEvent, getConnectionDetails } from "@/apps/github/helpers/helpers";
import {
  GithubEntityConnection,
  githubEntityConnectionSchema,
  GithubWorkspaceConnection,
  PullRequestWebhookActions,
} from "@/apps/github/types";
import { env } from "@/env";
import { CONSTANTS } from "@/helpers/constants";
import { getReferredIssues, IssueReference, IssueWithReference } from "@/helpers/parser";
import { logger } from "@/logger";
import { SentryInstance } from "@/sentry-config";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection } from "@/types";

const apiClient = getAPIClient();

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubPullRequestDedupPayload);
  return true;
};

const handlePullRequestOpened = async (data: GithubPullRequestDedupPayload) => {
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    source: E_INTEGRATION_KEYS.GITHUB,
    source_access_token: data.installationId.toString(),
  });

  if (!credentials || credentials.length !== 1) {
    if (credentials.length === 0) {
      logger.info("No credentials found for installation id", data.installationId);
      return false;
    }
    throw new Error(`Invalid credential set found for installation id ${data.installationId}`);
  }

  const planeCredentials = credentials[0];

  if (!planeCredentials.target_access_token) {
    logger.info("No target access token found for installation id", data.installationId);
    return false;
  }

  // Get the workspace connection for the installation
  const accountId = data.accountId;

  const { workspaceConnection } = await getConnectionDetails({
    accountId: accountId.toString(),
    credentials: planeCredentials as TServiceCredentials,
    installationId: data.installationId.toString(),
    repositoryId: data.repositoryId.toString(),
  });

  const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installationId.toString());
  const ghPullRequest = await ghService.getPullRequest(data.owner, data.repositoryName, Number(data.pullRequestNumber));

  const planeClient = new PlaneClient({
    baseURL: env.API_BASE_URL,
    apiToken: planeCredentials.target_access_token,
  });

  if (data.owner && data.repositoryName && data.pullRequestNumber) {
    const { closingReferences, nonClosingReferences } = getReferredIssues(
      ghPullRequest.data.title,
      ghPullRequest.data.body || ""
    );
    const stateEvent = classifyPullRequestEvent(ghPullRequest.data);

    let entityConnection: GithubEntityConnection | undefined;

    try {
      const targetEntityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_id: workspaceConnection.workspace_id,
        entity_type: E_INTEGRATION_KEYS.GITHUB,
        entity_id: data.repositoryId.toString(),
      });

      if (targetEntityConnection.length > 0) {
        entityConnection = verifyEntityConnection(githubEntityConnectionSchema, targetEntityConnection[0] as any);
      }
    } catch {
      logger.error(
        `[GITHUB] Error while verifying entity connection for pull request ${data.pullRequestNumber} in repo ${data.owner}/${data.repositoryName}`
      );
    }

    const targetState = getTargetState(stateEvent, entityConnection);

    const referredIssues =
      stateEvent && ["MR_CLOSED", "MR_MERGED"].includes(stateEvent)
        ? closingReferences
        : [...closingReferences, ...nonClosingReferences];

    const updatedIssues = await Promise.all(
      referredIssues.map((reference) =>
        updateIssue(
          planeClient,
          workspaceConnection,
          reference,
          targetState,
          ghPullRequest.data.title,
          ghPullRequest.data.number,
          ghPullRequest.data.html_url
        )
      )
    );

    const validIssues = updatedIssues.filter((issue): issue is IssueWithReference => issue !== null);

    if (validIssues.length > 0) {
      const body = createCommentBody(validIssues, nonClosingReferences, workspaceConnection);
      await handleComment(ghService, data.owner, data.repositoryName, Number(data.pullRequestNumber), body);
    }
  }
};

const handleComment = async (
  ghService: GithubService,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
) => {
  const commentPrefix = "Pull Request Linked with Plane Issues";
  const newCommentPrefix = "Pull Request Linked with Plane Work Items";

  const existingComments = await ghService.getPullRequestComments(owner, repo, pullNumber);
  const existingComment = existingComments.data.find(
    (comment) => comment.body?.startsWith(commentPrefix) || comment.body?.startsWith(newCommentPrefix)
  );

  if (existingComment) {
    await ghService.updatePullRequestComment(owner, repo, existingComment.id, body);
    logger.info(`[GITHUB] Updated comment for pull request ${pullNumber} in repo ${owner}/${repo}`);
  } else {
    await ghService.createPullRequestComment(owner, repo, pullNumber, body);
    logger.info(`[GITHUB] Created new comment for pull request ${pullNumber} in repo ${owner}/${repo}`);
  }
};

const createCommentBody = (
  issues: IssueWithReference[],
  nonClosingReferences: IssueReference[],
  workspaceConnection: GithubWorkspaceConnection
) => {
  const commentPrefix = "Pull Request Linked with Plane Work Items";
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
    body += `- [${reference.identifier}-${reference.sequence}] [${issue.name}](${env.APP_BASE_URL}/${workspaceConnection.workspace_slug}/projects/${issue.project}/issues/${issue.id})\n`;
  }

  if (nonClosingIssues.length > 0) {
    body += `\n\nReferences\n\n`;
    for (const { reference, issue } of nonClosingIssues) {
      body += `- [${reference.identifier}-${reference.sequence}] [${issue.name}](${env.APP_BASE_URL}/${workspaceConnection.workspace_slug}/projects/${issue.project}/issues/${issue.id})\n`;
    }
  }

  body += `\n\nComment Automatically Generated by [Plane](https://plane.so)\n`;
  return body;
};

const getTargetState = (event: MergeRequestEvent | undefined, entityConnection: GithubEntityConnection | undefined) => {
  if (!event || !entityConnection) {
    return null;
  }

  const targetState = entityConnection.config.states.mergeRequestEventMapping[event];
  if (!targetState) {
    logger.error(`[GITHUB] Target state not found for event ${event}, skipping...`);
    return null;
  }
  return targetState;
};

const updateIssue = async (
  planeClient: Client,
  workspaceConnection: GithubWorkspaceConnection,
  reference: IssueReference,
  targetState: { name: string; id: string } | null,
  prTitle: string,
  prNumber: number,
  prUrl: string
): Promise<IssueWithReference | null> => {

  let issue: ExIssue | null = null;

  try {
    issue = await planeClient.issue.getIssueByIdentifier(
      workspaceConnection.workspace_slug,
      reference.identifier,
      reference.sequence
    );

    if (targetState) {
      await planeClient.issue.update(workspaceConnection.workspace_slug, issue.project, issue.id, {
        state: targetState.id,
      });

      logger.info(`[GITHUB] Issue ${reference.identifier} updated to state ${targetState.name}`);
    }

    // create link to the pull request to the issue
    const linkTitle = `[${prNumber}] ${prTitle}`;
    await planeClient.issue.createLink(workspaceConnection.workspace_slug, issue.project, issue.id, linkTitle, prUrl);
    return { reference, issue };
  } catch (error: any) {
    if (error?.detail && error?.detail.includes(CONSTANTS.NO_PERMISSION_ERROR)) {
      logger.info(`[GITHUB] No permission to process event: ${error.detail} ${reference.identifier}-${reference.sequence}`);

      if (issue) {
        return { reference, issue };
      }

      return null;
    }

    logger.error(`[GITHUB] Error updating issue ${reference.identifier}-${reference.sequence}: ${error}`);
    SentryInstance?.captureException(error);

    if (issue) {
      return { reference, issue };
    }

    return null;
  }
};

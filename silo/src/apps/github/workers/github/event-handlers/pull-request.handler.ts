import { classifyPullRequestEvent, getConnectionDetails } from "@/apps/github/helpers/helpers";
import { GithubEntityConnection, GithubWorkspaceConnection, PullRequestWebhookActions } from "@/apps/github/types";
import { getCredentialsBySourceToken } from "@/db/query";
import { env } from "@/env";
import { getReferredIssues, IssueReference, IssueWithReference } from "@/helpers/parser";
import { logger } from "@/logger";
import { Client, Client as PlaneClient } from "@plane/sdk";
import { TServiceCredentials } from "@silo/core";
import { createGithubService, GithubService, GithubWebhookPayload } from "@silo/github";
import { MergeRequestEvent } from "@silo/gitlab";

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubWebhookPayload["webhook-pull-request-opened"]);
  return true;
};

const handlePullRequestOpened = async (data: GithubWebhookPayload["webhook-pull-request-opened"]) => {
  if (data.installation) {
    const credentials = await getCredentialsBySourceToken(data.installation.id.toString());

    if (!credentials || credentials.length === 0) {
      logger.info("No credentials found for installation id", data.installation.id);
      return false;
    }

    const planeCredentials = credentials[0];

    if (!planeCredentials.target_access_token) {
      logger.info("No target access token found for installation id", data.installation.id);
      return false;
    }

    // Get the workspace connection for the installation
    const accountId = data.organization ? data.organization.id : data.repository.owner.id;

    const { workspaceConnection, entityConnection } = await getConnectionDetails({
      accountId: accountId.toString(),
      credentials: planeCredentials as TServiceCredentials,
      installationId: data.installation.id.toString(),
      repositoryId: data.repository.id.toString(),
    });

    const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installation.id.toString());

    const planeClient = new PlaneClient({
      baseURL: workspaceConnection.targetHostname,
      apiToken: planeCredentials.target_access_token,
    });

    const attachedClosingReferences = await ghService.getPullRequestWithClosingReference(
      data.repository.owner.login,
      data.repository.name,
      data.pull_request.number
    );

    // For all closing references, fetch the issues for the external id and
    // external source and add a link in plane issue for the bound PR
    for (const reference of attachedClosingReferences.repository.pullRequest.closingIssuesReferences.edges) {
      try {
        const issue = await planeClient.issue.getIssueWithExternalId(
          entityConnection.workspaceSlug,
          entityConnection.projectId,
          reference.node.databaseId.toString(),
          "GITHUB"
        );

        if (issue) {
          // Create a link in the issue for the pull request
          await planeClient.issue.createLink(
            entityConnection.workspaceSlug,
            entityConnection.projectId,
            issue.id,
            `GitHub PR: ${data.pull_request.title}`,
            data.pull_request.html_url
          );
        }
      } catch (error) {
        logger.error("Error while creating link in issue", error);
        console.log(error);
        continue;
      }
    }

    if (data.repository.owner.login && data.repository.name && data.pull_request.number) {
      const { closingReferences, nonClosingReferences } = getReferredIssues(
        data.pull_request.title,
        data.pull_request.body || ""
      );
      const stateEvent = classifyPullRequestEvent(data.action, data.pull_request);
      const targetState = getTargetState(stateEvent, entityConnection);

      const referredIssues = ["MR_CLOSED", "MR_MERGED"].includes(stateEvent)
        ? closingReferences
        : [...closingReferences, ...nonClosingReferences];

      const updatedIssues = await Promise.all(
        referredIssues.map((reference) => updateIssue(planeClient, entityConnection, reference, targetState))
      );

      const validIssues = updatedIssues.filter((issue): issue is IssueWithReference => issue !== null);

      const body = createCommentBody(validIssues, nonClosingReferences, workspaceConnection);

      await handleComment(ghService, data.repository.owner.login, data.repository.name, data.pull_request.number, body);
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
  const existingComments = await ghService.getPullRequestComments(owner, repo, pullNumber);
  const existingComment = existingComments.data.find((comment) => comment.body?.startsWith(commentPrefix));

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
  const commentPrefix = "Pull Request Linked with Plane Issues";
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

const getTargetState = (event: MergeRequestEvent, entityConnection: GithubEntityConnection) => {
  const targetState = entityConnection.config.states.mergeRequestEventMapping[event];
  if (!targetState) {
    logger.error(`[GITLAB] Target state not found for event ${event}, skipping...`);
    return null;
  }
  return targetState;
};

const updateIssue = async (
  planeClient: Client,
  entityConnection: any,
  reference: IssueReference,
  targetState: any
): Promise<IssueWithReference | null> => {
  try {
    const issue = await planeClient.issue.getIssueByIdentifier(
      entityConnection.workspaceSlug,
      reference.identifier,
      reference.sequence
    );

    await planeClient.issue.update(entityConnection.workspaceSlug, issue.project, issue.id, {
      state: targetState.id,
    });

    logger.info(`[GITHUB] Issue ${reference.identifier} updated to state ${targetState.name}`);
    return { reference, issue };
  } catch (error) {
    logger.error(`[GITHUB] Error updating issue ${reference.identifier}-${reference.sequence}: ${error}`);
    return null;
  }
};

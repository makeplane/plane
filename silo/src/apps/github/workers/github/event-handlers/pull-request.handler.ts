import { E_INTEGRATION_KEYS, TServiceCredentials } from "@plane/etl/core";
import { createGithubService, GithubService, GithubWebhookPayload } from "@plane/etl/github";
import { MergeRequestEvent } from "@plane/etl/gitlab";
import { Client, Client as PlaneClient } from "@plane/sdk";
import { classifyPullRequestEvent, getConnectionDetails } from "@/apps/github/helpers/helpers";
import {
  GithubEntityConnection,
  githubEntityConnectionSchema,
  GithubWorkspaceConnection,
  PullRequestWebhookActions,
} from "@/apps/github/types";
import { env } from "@/env";
import { getReferredIssues, IssueReference, IssueWithReference } from "@/helpers/parser";
import { logger } from "@/logger";
import { SentryInstance } from "@/sentry-config";
import { getAPIClient } from "@/services/client";
import { verifyEntityConnection } from "@/types";

const apiClient = getAPIClient();

export const handlePullRequestEvents = async (action: PullRequestWebhookActions, data: unknown) => {
  await handlePullRequestOpened(data as unknown as GithubWebhookPayload["webhook-pull-request-opened"]);
  return true;
};

const handlePullRequestOpened = async (data: GithubWebhookPayload["webhook-pull-request-opened"]) => {
  if (data.installation) {
    const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
      source: E_INTEGRATION_KEYS.GITHUB,
      source_access_token: data.installation.id.toString(),
    });

    if (!credentials || credentials.length !== 1) {
      throw new Error(`Invalid credential set found for installation id ${data.installation.id}`);
    }

    const planeCredentials = credentials[0];

    if (!planeCredentials.target_access_token) {
      logger.info("No target access token found for installation id", data.installation.id);
      return false;
    }

    // Get the workspace connection for the installation
    const accountId = data.organization ? data.organization.id : data.repository.owner.id;

    const { workspaceConnection } = await getConnectionDetails({
      accountId: accountId.toString(),
      credentials: planeCredentials as TServiceCredentials,
      installationId: data.installation.id.toString(),
      repositoryId: data.repository.id.toString(),
    });

    const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installation.id.toString());

    const planeClient = new PlaneClient({
      baseURL: env.API_BASE_URL,
      apiToken: planeCredentials.target_access_token,
    });

    // const attachedClosingReferences = await ghService.getPullRequestWithClosingReference(
    //   data.repository.owner.login,
    //   data.repository.name,
    //   data.pull_request.number
    // );

    // For all closing references, fetch the issues for the external id and
    // external source and add a link in plane issue for the bound PR
    // for (const reference of attachedClosingReferences.repository.pullRequest.closingIssuesReferences.edges) {
    //   try {
    //
    //     const issue = await planeClient.issue.getIssueWithExternalId(
    //       workspaceConnection.workspace_slug,
    //       entityConnection.project_id ?? "",
    //       reference.node.databaseId.toString(),
    //       E_INTEGRATION_KEYS.GITHUB
    //     );
    //
    //     if (issue) {
    //       // Create a link in the issue for the pull request
    //       await planeClient.issue.createLink(
    //         entityConnection.workspace_slug,
    //         entityConnection.project_id ?? "",
    //         issue.id,
    //         `GitHub PR: ${data.pull_request.title}`,
    //         data.pull_request.html_url
    //       );
    //     }
    //   } catch (error) {
    //     logger.error("Error while creating link in issue", error);
    //     console.log(error);
    //     SentryInstance?.captureException(error);
    //     continue;
    //   }
    // }

    if (data.repository.owner.login && data.repository.name && data.pull_request.number) {
      const { closingReferences, nonClosingReferences } = getReferredIssues(
        data.pull_request.title,
        data.pull_request.body || ""
      );
      const stateEvent = classifyPullRequestEvent(data.action, data.pull_request);

      let entityConnection: GithubEntityConnection | undefined;

      try {
        const targetEntityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
          workspace_id: workspaceConnection.workspace_id,
          entity_type: E_INTEGRATION_KEYS.GITHUB,
          entity_id: data.repository.id.toString(),
        });

        entityConnection = verifyEntityConnection(githubEntityConnectionSchema, targetEntityConnection[0] as any);
      } catch { }

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
            data.pull_request.title,
            data.pull_request.number,
            data.pull_request.html_url
          )
        )
      );

      const validIssues = updatedIssues.filter((issue): issue is IssueWithReference => issue !== null);

      if (validIssues.length > 0) {
        const body = createCommentBody(validIssues, nonClosingReferences, workspaceConnection);
        await handleComment(
          ghService,
          data.repository.owner.login,
          data.repository.name,
          data.pull_request.number,
          body
        );
      }
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
  try {
    const issue = await planeClient.issue.getIssueByIdentifier(
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
    try {
      await planeClient.issue.createLink(workspaceConnection.workspace_slug, issue.project, issue.id, linkTitle, prUrl);
    } catch (error) {
      console.log(error);
    }

    return { reference, issue };
  } catch (error) {
    console.log(error);
    logger.error(`[GITHUB] Error updating issue ${reference.identifier}-${reference.sequence}: ${error}`);
    SentryInstance?.captureException(error);
    return null;
  }
};

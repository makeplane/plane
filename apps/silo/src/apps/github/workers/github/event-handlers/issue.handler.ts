import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import {
  EGithubEntityConnectionType,
  GithubIssueDedupPayload,
  transformGitHubIssue,
  WebhookGitHubIssue,
} from "@plane/etl/github";
import { ExIssue } from "@plane/sdk";
import { TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { getGithubService } from "@/apps/github/helpers";
import { getConnDetailsForGithubToPlaneSync } from "@/apps/github/helpers/helpers";
import { env } from "@/env";
import { GITHUB_LABEL } from "@/helpers/constants";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { logger } from "@/logger";
import { Store } from "@/worker/base";

export type IssueWebhookActions =
  | "assigned"
  | "closed"
  | "deleted"
  | "demilestoned"
  | "edited"
  | "labeled"
  | "locked"
  | "milestoned"
  | "opened"
  | "pinned"
  | "reopened"
  | "transferred"
  | "unassigned"
  | "unlabeled"
  | "unlocked"
  | "unpinned";

const SYNC_LABEL = "plane";

export const handleIssueEvents = async (store: Store, action: IssueWebhookActions, data: unknown) => {
  // If the issue number exist inside the store, skip it
  // @ts-expect-error
  if (data && data.issueNumber) {
    // @ts-expect-error
    const exist = await store.get(`silo:issue:${data.issueNumber}`);
    if (exist) {
      logger.info(`[GITHUB][ISSUE] Event Processed Successfully, confirmed by target`);
      // Remove the webhook from the store
      // @ts-expect-error
      await store.del(`silo:issue:${data.issueNumber}`);
      return true;
    }
  }

  await syncIssueWithPlane(store, data as GithubIssueDedupPayload);
  return true;
};

export const shouldSync = (labels: { name: string }[]): boolean =>
  labels.some((label) => label.name.toLowerCase() === SYNC_LABEL);

export const syncIssueWithPlane = async (store: Store, data: GithubIssueDedupPayload) => {
  try {
    const ghIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
    logger.info(`${ghIntegrationKey}[ISSUE] Received webhook event from github 🐱 --------- [CREATE|UPDATE]`);
    const { userCredentials, wsAdminCredentials } =
      await integrationConnectionHelper.getUserAndWSAdminCredentialsWithAdminFallback(
        ghIntegrationKey,
        data.installationId.toString(),
        data.eventActorId
      );

    if (!userCredentials || !wsAdminCredentials) {
      logger.info(`${ghIntegrationKey}[ISSUE] No plane credentials found, skipping`, {
        installationId: data.installationId,
        accountId: data.accountId,
        repositoryId: data.repositoryId,
      });
      return;
    }

    const { workspaceConnection, entityConnectionForRepository: entityConnection } =
      await getConnDetailsForGithubToPlaneSync({
        wsAdminCredentials: wsAdminCredentials as TWorkspaceCredential,
        isEnterprise: data.isEnterprise,
        type: EGithubEntityConnectionType.PROJECT_ISSUE_SYNC,
        repositoryId: data.repositoryId.toString(),
      });

    if (!workspaceConnection.target_hostname) {
      throw new Error("Target hostname not found");
    }

    // If the Plane GitHub App client ID or client secret is not found, return
    const planeClient = await getPlaneAPIClient(wsAdminCredentials, ghIntegrationKey);

    let issue: ExIssue | null = null;

    const ghService = getGithubService(
      workspaceConnection as TGithubWorkspaceConnection,
      data.installationId.toString(),
      data.isEnterprise
    );
    const ghIssue = await ghService.getIssue(data.owner, data.repositoryName, Number(data.issueNumber));
    const bodyHtml = await ghService.getBodyHtml(data.owner, data.repositoryName, Number(data.issueNumber));
    // replace the issue body with the html body

    if (!entityConnection) {
      logger.info(`${ghIntegrationKey}[ISSUE sync] No entity connection found, skipping`, {
        repositoryId: data.repositoryId,
      });
      return;
    }

    try {
      issue = await planeClient.issue.getIssueWithExternalId(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        data.issueNumber.toString(),
        ghIntegrationKey
      );
    } catch (error) {}

    const planeUsers = await planeClient.users.list(entityConnection.workspace_slug, entityConnection.project_id ?? "");

    const userMap: Record<string, string> = Object.fromEntries(
      workspaceConnection.config.userMap.map((obj: any) => [obj.githubUser.login, obj.planeUser.id])
    );

    // get the issue state mapping from the entity connection to set the issue state
    const issueStateMap = entityConnection.config.states?.issueEventMapping;
    const planeIssue = await transformGitHubIssue(
      ghIssue.data as WebhookGitHubIssue,
      bodyHtml ?? "<p></p>",
      encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/assets/${ghIntegrationKey.toLowerCase()}`),
      planeClient,
      data.repositoryName,
      userMap,
      issueStateMap,
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      planeUsers,
      ghService,
      ghIntegrationKey,
      issue ? true : false
    );

    const users = await planeClient.users.list(entityConnection.workspace_slug, entityConnection.project_id ?? "");

    if (planeIssue.labels) {
      const labels = (await planeClient.label.list(entityConnection.workspace_slug, entityConnection.project_id ?? ""))
        .results;
      const githubLabel = labels.find((l) => l.name.toLowerCase() === GITHUB_LABEL);

      if (githubLabel) {
        planeIssue.labels.push(githubLabel.name);
      }

      if (
        ghIssue.data.labels &&
        Array.isArray(ghIssue.data.labels) &&
        ghIssue.data.labels.every((label) => typeof label !== "string")
      ) {
        const labelsToCreate = ghIssue.data.labels.filter((label: any) => !labels.find((l) => l.name === label.name));

        const labelPromises = labelsToCreate.map(async (label: any) => {
          const createdLabel = await planeClient.label.create(
            entityConnection.workspace_slug,
            entityConnection.project_id ?? "",
            {
              name: label.name,
              color: `#${label.color}`,
              external_id: label.id ? label.id.toString() : label.name,
              external_source: ghIntegrationKey,
            }
          );

          return createdLabel;
        });

        const createdLabels = await Promise.all(labelPromises);
        labels.push(...createdLabels);
      }

      planeIssue.labels = planeIssue.labels
        .map((label) => {
          const l = labels.find((l) => l.name === label);
          if (l) {
            return l.id;
          }
        })
        .filter((l) => l !== undefined) as string[];
    }

    if (planeIssue.assignees) {
      planeIssue.assignees = planeIssue.assignees
        .map((assignee) => {
          const user = users.find((u) => u.id === assignee);
          if (user) {
            return user.id;
          }
        })
        .filter((u) => u !== undefined) as string[];
    }

    if (planeIssue.created_by) {
      const user = users.find((u) => u.display_name === planeIssue.created_by);
      if (user) {
        planeIssue.created_by = user.id;
      }
    }

    if (issue) {
      await planeClient.issue.update(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        issue.id,
        planeIssue
      );
      await store.set(`silo:issue:${issue.id}`, "true");
    } else {
      const createdIssue = await planeClient.issue.create(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        planeIssue
      );

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entity_slug}] ${ghIssue?.data.title} #${ghIssue?.data.number}`;
        const linkUrl = ghIssue?.data.html_url;
        await planeClient.issue.createLink(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          createdIssue.id,
          linkTitle,
          linkUrl
        );
      };

      const createLinkBack = async () => {
        // Get the project for the issue
        const project = await planeClient.project.getProject(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? ""
        );
        const issueUrl = getIssueUrlFromSequenceId(
          entityConnection.workspace_slug,
          project.identifier ?? "",
          createdIssue.sequence_id.toString()
        );
        const comment = `Synced with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[[${project.identifier}-${createdIssue.sequence_id}] ${createdIssue.name}](${issueUrl})`;
        await ghService.createIssueComment(data.owner, data.repositoryName, Number(data.issueNumber), comment);
      };

      await Promise.all([createLink(), createLinkBack(), store.set(`silo:issue:${createdIssue.id}`, "true")]);
    }
  } catch (error) {
    logger.error("Error syncing issue with Plane", error);
    throw error;
  }
};

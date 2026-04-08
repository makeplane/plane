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

import type { GithubIssueDedupPayload, WebhookGitHubIssue } from "@plane/etl/github";
import { EGithubEntityConnectionType } from "@plane/etl/github";
import { logger } from "@plane/logger";
import type { ExIssue } from "@plane/sdk";
import type { TGithubWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { getGithubService } from "@/apps/github/helpers";
import { getConnDetailsForGithubToPlaneSync } from "@/apps/github/helpers/helpers";
import { transformGitHubIssue } from "@/apps/github/helpers/transform";
import { IssueWebhookActions } from "@/apps/github/types";
import { env } from "@/env";
import { GITHUB_LABEL } from "@/helpers/constants";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import type { Store } from "@/worker/base";

const SYNC_LABEL = "plane";

export const handleIssueEvents = async (store: Store, action: string, data: unknown) => {
  // Check if this webhook was triggered by our own Plane->GitHub sync (loop prevention)
  // The Plane->GitHub handler sets a temporary key right after syncing to GitHub
  // @ts-expect-error  - Ignoring ts error for data type
  if (data && data.issueNumber) {
    // @ts-expect-error - Ignoring ts error for store get
    const exist = await store.get(`silo:issue:gh:${data.issueNumber}`);
    if (exist) {
      logger.info(`[GITHUB][ISSUE] Event triggered by Plane->GitHub sync, skipping to prevent loop`);
      // Remove the key so future legitimate webhooks are not blocked
      // @ts-expect-error - Ignoring ts error for store del
      await store.del(`silo:issue:gh:${data.issueNumber}`);
      return true;
    }
  }

  await syncIssueWithPlane(store, action as IssueWebhookActions, data as GithubIssueDedupPayload);
  return true;
};

export const shouldSync = (labels: { name: string }[]): boolean =>
  labels.some((label) => label.name.toLowerCase() === SYNC_LABEL);

export const syncIssueWithPlane = async (store: Store, action: IssueWebhookActions, data: GithubIssueDedupPayload) => {
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
        wsAdminCredentials: wsAdminCredentials,
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

    const ghService = getGithubService(workspaceConnection, data.installationId.toString(), data.isEnterprise);

    // Fetch GitHub issue with error handling for deleted issues
    let ghIssue;
    let bodyHtml;
    try {
      ghIssue = await ghService.getIssue(data.owner, data.repositoryName, Number(data.issueNumber));
      bodyHtml = await ghService.getBodyHtml(data.owner, data.repositoryName, Number(data.issueNumber));
    } catch (error: any) {
      // Handle deleted issues gracefully
      if (error?.message?.includes("deleted") || error?.status === 404 || error?.status === 410) {
        logger.info(`${ghIntegrationKey}[ISSUE] Issue was deleted from GitHub, skipping sync`, {
          owner: data.owner,
          repository: data.repositoryName,
          issueNumber: data.issueNumber,
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

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

      // if the github label exists, add it to the plane issue
      if (githubLabel) {
        planeIssue.labels.push(githubLabel.name);
      } else {
        // create the github label
        const createdGithubLabel = await planeClient.label.create(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          { name: GITHUB_LABEL, color: "#003773" }
        );
        labels.push(createdGithubLabel);
        planeIssue.labels.push(createdGithubLabel.name);
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

      // add the labels to the plane issue by finding it from the created labels array
      planeIssue.labels = planeIssue.labels
        .map((label) => {
          const l = labels.find((l) => l.name === label);
          if (l) {
            return l.id;
          }
        })
        .filter((l) => l !== undefined);
    }

    if (planeIssue.created_by) {
      const user = users.find((u) => u.display_name === planeIssue.created_by);
      if (user) {
        planeIssue.created_by = user.id;
      }
    }

    // only update issue state if action is "opened" or "closed" or "reopened" on existing issue
    if (
      ![IssueWebhookActions.OPENED, IssueWebhookActions.CLOSED, IssueWebhookActions.REOPENED].includes(action) &&
      issue
    ) {
      delete planeIssue["state"];
    }

    if (issue) {
      await planeClient.issue.update(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        issue.id,
        planeIssue
      );
      // Set key with Plane issue ID so Plane->GitHub handler can detect and skip
      // Use 5 second TTL to allow the webhook loop back but expire quickly
      await store.set(`silo:issue:plane:${issue.id}`, "true", 60);
    } else {
      let createdIssue;
      try {
        createdIssue = await planeClient.issue.create(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          planeIssue
        );
      } catch (error: any) {
        // Handle duplicate issue creation gracefully
        if (error?.error?.includes("already exists") || error?.message?.includes("already exists")) {
          logger.info(
            `${ghIntegrationKey}[ISSUE] Issue with external_id already exists, attempting to fetch and update`,
            {
              external_id: data.issueNumber.toString(),
            }
          );

          // Try to fetch the existing issue and update it instead
          try {
            issue = await planeClient.issue.getIssueWithExternalId(
              entityConnection.workspace_slug,
              entityConnection.project_id ?? "",
              data.issueNumber.toString(),
              ghIntegrationKey
            );

            if (issue) {
              await planeClient.issue.update(
                entityConnection.workspace_slug,
                entityConnection.project_id ?? "",
                issue.id,
                planeIssue
              );
            }
          } catch (fetchError) {
            logger.error(`${ghIntegrationKey}[ISSUE] Failed to fetch existing issue after duplicate error`, fetchError);
          }
          // Set the store key regardless of fetch/update success to prevent webhook loops
          if (issue) {
            await store.set(`silo:issue:plane:${issue.id}`, "true", 60);
          }
          // Exit early for duplicate errors - no need to create links
          return;
        }
        // Re-throw if it's not a duplicate error
        throw error;
      }

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

      // Set key with Plane issue ID so Plane->GitHub handler can detect and skip
      await Promise.all([createLink(), createLinkBack(), store.set(`silo:issue:plane:${createdIssue.id}`, "true", 60)]);
    }
  } catch (error) {
    logger.error("Error syncing issue with Plane", error);
    throw error;
  }
};

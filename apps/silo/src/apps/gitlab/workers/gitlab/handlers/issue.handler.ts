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

import type { ExIssue } from "@plane/sdk";
import type { GitlabIssue, GitlabIssueEvent } from "@plane/etl/gitlab";
import type { TGitlabEntityConnection, TGitlabWorkspaceConnection } from "@plane/types";
import type { Store } from "@/worker/base";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { GITLAB_LABEL } from "@/helpers/constants";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { EGitlabEntityConnectionType, GitLabService, GitlabIssueWebhookActions } from "@plane/etl/gitlab";
import { getGitlabClientService } from "@/apps/gitlab/services";
import { transformGitlabIssue } from "@/apps/gitlab/helpers/transform";
import { getConnDetailsForGitlabToPlaneSync } from "@/apps/gitlab/helpers/connection-details";
import {
  GITLAB_ISSUE_CACHE_KEY,
  GITLAB_ISSUE_EXTERNAL_ID,
  PLANE_GITLAB_ISSUE_CACHE_KEY,
} from "@/apps/gitlab/helpers/cache-keys";
import { createGitlabIssueLinkedComment } from "@/apps/gitlab/helpers/methods";
import { shouldSyncGitlabToPlane } from "@/apps/gitlab/helpers/helpers";
import { GITLAB_ISSUE_LINKED_COMMENT_PREFIX, GITLAB_SUPPORTED_WORK_ITEM_TYPES } from "@/apps/gitlab/helpers/constants";
import { getGitlabUploadsPrefix } from "@/apps/gitlab/helpers/urls";

export const handleIssueEvents = async (store: Store, data: GitlabIssueEvent) => {
  // Check if this webhook was triggered by our own Plane->GitHub sync (loop prevention)
  // The Plane->Gitlab handler sets a temporary key right after syncing to Gitlab
  if (!GITLAB_SUPPORTED_WORK_ITEM_TYPES.includes(data.object_attributes.type)) {
    logger.info(`[GITLAB][ISSUE] Work item type is not supported, skipping`, {
      workItemType: data.object_attributes.type,
    });
    return true;
  }
  if (data && data.object_attributes.id) {
    const glIssueCacheKey = GITLAB_ISSUE_CACHE_KEY(data.project.id.toString(), data.object_attributes.id.toString());
    const exist = await store.get(glIssueCacheKey);
    if (exist) {
      logger.info(`[GITLAB][ISSUE] Event triggered by Plane->Gitlab sync, skipping to prevent loop`);
      // Remove the key so future legitimate webhooks are not blocked
      await store.del(glIssueCacheKey);
      return true;
    }
  }

  await syncIssueWithPlane(store, data);
  return true;
};

export const syncIssueWithPlane = async (store: Store, data: GitlabIssueEvent) => {
  try {
    const glIntegrationKey = data.isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
    logger.info(`${glIntegrationKey}[ISSUE] Received webhook event from gitlab 🐱 --------- [CREATE|UPDATE]`);

    const result = await getConnDetailsForGitlabToPlaneSync(
      data.project.id.toString(),
      EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC,
      data.isEnterprise ?? false
    );
    if (!result) {
      logger.info(
        `${glIntegrationKey}[ISSUE] No credential or entity connection or workspace connection found, skipping`,
        {
          projectId: data.project.id,
        }
      );
      return;
    }

    const { credential: userCredentials, entityConnection, workspaceConnection } = result;

    // If the Plane GitHub App client ID or client secret is not found, return
    const planeClient = await getPlaneAPIClient(userCredentials, glIntegrationKey);

    let issue: ExIssue | null = null;

    let glService: GitLabService;
    if (data.isEnterprise) {
      const appConfig = workspaceConnection.connection_data?.appConfig;
      glService = await getGitlabClientService(
        workspaceConnection.workspace_id,
        glIntegrationKey,
        appConfig?.baseUrl,
        appConfig?.clientId,
        appConfig?.clientSecret
      );
    } else {
      glService = await getGitlabClientService(workspaceConnection.workspace_id, glIntegrationKey, undefined);
    }
    const glIssue = await glService.getIssue(data.project.id, data.object_attributes.iid);
    // replace the issue body with the html body

    if (!shouldSyncGitlabToPlane(glIssue.labels)) {
      logger.info(`${glIntegrationKey}[ISSUE] Issue doesn't have a plane label, skipping issue sync via Gitlab`, {
        projectId: data.project.id,
        glIntegrationKey,
        issueId: data.object_attributes.id,
        labels: glIssue.labels,
      });
      return;
    }

    try {
      issue = await planeClient.issue.getIssueWithExternalId(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        GITLAB_ISSUE_EXTERNAL_ID(data.project.id.toString(), data.object_attributes.iid.toString()),
        glIntegrationKey
      );
    } catch (error) {}

    // get the issue state mapping from the entity connection to set the issue state
    const issueStateMap = entityConnection.config.states?.issueEventMapping;
    const gitlabBaseUrl = workspaceConnection.connection_data?.appConfig?.baseUrl;
    const gitlabUploadsPrefix = getGitlabUploadsPrefix(data.project.id.toString(), gitlabBaseUrl);
    const planeIssue = await transformGitlabIssue(
      glIssue,
      planeClient,
      data.project.path_with_namespace,
      issueStateMap,
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      glService,
      userCredentials.source_access_token ?? "",
      env.API_BASE_URL,
      gitlabUploadsPrefix,
      gitlabBaseUrl,
      data.isEnterprise ?? false
    );

    if (planeIssue.labels) {
      const labels = (await planeClient.label.list(entityConnection.workspace_slug, entityConnection.project_id ?? ""))
        .results;
      const gitlabLabel = labels.find((l) => l.name.toLowerCase() === GITLAB_LABEL);

      // if the gitlab label exists, add it to the plane issue
      if (gitlabLabel) {
        planeIssue.labels.push(gitlabLabel.name);
      } else {
        // create the gitlab label
        const createdGitlabLabel = await planeClient.label.create(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          { name: GITLAB_LABEL, color: "#003773" }
        );
        labels.push(createdGitlabLabel);
        planeIssue.labels.push(createdGitlabLabel.name);
      }

      if (glIssue.labels && Array.isArray(glIssue.labels)) {
        const labelsToCreate = glIssue.labels.filter(
          (label: string) => !labels.find((l) => l.name.toLowerCase() === label.toLowerCase())
        );

        const labelPromises = labelsToCreate.map(async (label: string) => {
          const createdLabel = await planeClient.label.create(
            entityConnection.workspace_slug,
            entityConnection.project_id ?? "",
            {
              name: label.toLowerCase(),
              color: `#003773`,
              external_id: label.toLowerCase(),
              external_source: glIntegrationKey,
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
          const l = labels.find((l) => l.name.toLowerCase() === label.toLowerCase());
          if (l) {
            return l.id;
          }
        })
        .filter((l) => l !== undefined);
    }

    // only update issue state if action is "opened" or "closed" or "reopened" on existing issue
    if (
      ![GitlabIssueWebhookActions.OPEN, GitlabIssueWebhookActions.CLOSE, GitlabIssueWebhookActions.REOPEN].includes(
        data.object_attributes.action
      ) &&
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
      await store.set(PLANE_GITLAB_ISSUE_CACHE_KEY(issue.id), "true", 60);
    } else {
      const createdIssue = await planeClient.issue.create(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        planeIssue
      );

      const createIssueLinkEntityConnection = async () => {
        return await createGitlabIssueLinkedComment(
          planeClient,
          entityConnection.workspace_slug,
          workspaceConnection.id,
          workspaceConnection.workspace_id,
          entityConnection.project_id ?? "",
          createdIssue.id,
          GITLAB_ISSUE_EXTERNAL_ID(data.project.id.toString(), data.object_attributes.iid.toString()),
          glIntegrationKey
        );
      };

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entity_slug}] ${glIssue?.title} #${glIssue?.iid}`;
        const linkUrl = glIssue?.web_url;
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
        const comment = `${GITLAB_ISSUE_LINKED_COMMENT_PREFIX}\n\nSynced with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[[${project.identifier}-${createdIssue.sequence_id}] ${createdIssue.name}](${issueUrl})`;
        await glService.createIssueComment(data.project.id, Number(data.object_attributes.iid), comment);
      };

      // Set key with Plane issue ID so Plane->GitHub handler can detect and skip
      await Promise.all([
        createLink(),
        createLinkBack(),
        createIssueLinkEntityConnection(),
        store.set(PLANE_GITLAB_ISSUE_CACHE_KEY(createdIssue.id), "true", 60),
      ]);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("[GITLAB][ISSUE] Error syncing issue with Plane", errorMessage);
    throw error;
  }
};

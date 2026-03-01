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

import type { ExIssue, ExIssueLabel, Client as PlaneClient, PlaneWebhookPayload } from "@plane/sdk";
import type { TGitlabEntityConnection, TGitlabWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import type { Store } from "@/worker/base";
import type { GitlabIssue, GitLabService } from "@plane/etl/gitlab";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { transformPlaneIssue } from "@/apps/gitlab/helpers/transform";
import { env } from "@/env";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import {
  GITLAB_ISSUE_CACHE_KEY,
  GITLAB_ISSUE_EXTERNAL_ID,
  PLANE_GITLAB_ISSUE_CACHE_KEY,
} from "@/apps/gitlab/helpers/cache-keys";
import { getConnDetailsForPlaneToGitlabSync } from "@/apps/gitlab/helpers/connection-details";
import { getGitlabClientService } from "@/apps/gitlab/services";
import { shouldSyncPlaneToGitlab } from "@/apps/gitlab/helpers/helpers";
import { createGitlabIssueLinkedComment } from "@/apps/gitlab/helpers/methods";
import { GITLAB_ISSUE_LINKED_COMMENT_PREFIX } from "@/apps/gitlab/helpers/constants";

export const handleIssueWebhook = async (store: Store, payload: PlaneWebhookPayload) => {
  // Check if this webhook was triggered by our own Plane->Gitlab sync (loop prevention)
  // The GitHub->Plane handler sets a temporary key with the Plane issue ID
  if (payload && payload.id) {
    const planeIssueCacheKey = PLANE_GITLAB_ISSUE_CACHE_KEY(payload.id);
    const exist = await store.get(planeIssueCacheKey);
    if (exist) {
      logger.info("[PLANE][ISSUE] Event triggered by Plane->Gitlab sync, skipping to prevent loop");
      // Remove the key so future legitimate webhooks are not blocked
      await store.del(planeIssueCacheKey);
      return true;
    }
  }

  logger.info(`[PLANE][ISSUE] Received webhook event from plane for Gitlab 🐱 --------- [${payload.event}]`);

  await handleIssueSync(store, payload);
};

const handleIssueSync = async (store: Store, payload: PlaneWebhookPayload) => {
  try {
    const glIntegrationKey = payload.isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
    // Get the entity connection
    const result = await getConnDetailsForPlaneToGitlabSync(payload.workspace, payload.project, payload.isEnterprise);
    if (!result) {
      logger.info(
        `${glIntegrationKey}[ISSUE] No credential or entity connection or workspace connection found, skipping`,
        {
          workspace: payload.workspace,
          project: payload.project,
        }
      );
      return;
    }

    const { workspaceConnection, entityConnection, credentials } = result;

    // Check if bidirectional sync is enabled
    if (!entityConnection.config.allowBidirectionalSync) {
      logger.info(`${glIntegrationKey} Bidirectional sync is disabled, skipping issue sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
      });
      return;
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, glIntegrationKey);

    // Create or update issue in GitHub
    let glService: GitLabService;
    if (payload.isEnterprise) {
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

    const issue = await planeClient.issue.getIssue(entityConnection.workspace_slug, payload.project, payload.id);
    if (!shouldSyncPlaneToGitlab(issue.labels as unknown as ExIssueLabel[])) {
      logger.info(`${glIntegrationKey} Issue doesn't have a gitlab label, skipping issue sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
        issueId: payload.id,
      });
      return;
    }

    const glIssue = await createOrUpdateGitlabIssue(
      glService,
      planeClient,
      issue,
      credentials,
      workspaceConnection,
      entityConnection,
      issue.labels as unknown as ExIssueLabel[],
      glIntegrationKey
    );

    // Update Plane issue with external_id and external_source
    if (
      !issue.external_id ||
      !issue.external_source ||
      (issue.external_source && issue.external_source !== glIntegrationKey)
    ) {
      // Add the external id and source
      const addExternalId = async () => {
        await planeClient.issue.update(entityConnection.workspace_slug, entityConnection.project_id ?? "", payload.id, {
          external_id: GITLAB_ISSUE_EXTERNAL_ID(glIssue.project_id.toString(), glIssue?.iid.toString()),
          external_source: glIntegrationKey,
        });
      };

      // Create link to issue created in GitHub
      const createLink = async () => {
        const linkTitle = `[${entityConnection.entity_slug}] ${glIssue?.title} #${glIssue?.iid}`;
        const linkUrl = glIssue?.web_url;
        await planeClient.issue.createLink(
          entityConnection.workspace_slug,
          entityConnection.project_id ?? "",
          issue.id,
          linkTitle,
          linkUrl
        );
      };

      const createIssueLinkEntityConnection = async () => {
        return await createGitlabIssueLinkedComment(
          planeClient,
          entityConnection.workspace_slug,
          workspaceConnection.id,
          workspaceConnection.workspace_id,
          entityConnection.project_id ?? "",
          issue.id,
          GITLAB_ISSUE_EXTERNAL_ID(glIssue.project_id.toString(), glIssue?.iid.toString()),
          glIntegrationKey
        );
      };

      // Execute all the promises
      await Promise.all([addExternalId(), createLink(), createIssueLinkEntityConnection()]);
    }

    // Set key with GitHub issue number so GitHub->Plane handler can detect and skip
    // Use 5 second TTL to allow the webhook loop back but expire quickly
    const glIssueCacheKey = GITLAB_ISSUE_CACHE_KEY(glIssue.project_id.toString(), glIssue?.id.toString());
    await store.set(glIssueCacheKey, "true", 60);
  } catch (error) {
    logger.error("[Plane][Gitlab] Error handling issue create/update event", {
      error,
      workspace: payload.workspace,
      project: payload.project,
    });
  }
};

const createOrUpdateGitlabIssue = async (
  glService: GitLabService,
  planeClient: PlaneClient,
  issue: ExIssue,
  credentials: TWorkspaceCredential,
  workspaceConnection: TGitlabWorkspaceConnection,
  entityConnection: TGitlabEntityConnection,
  labels: ExIssueLabel[],
  glIntegrationKey: E_INTEGRATION_KEYS
) => {
  const isEnterprise = glIntegrationKey === E_INTEGRATION_KEYS.GITLAB_ENTERPRISE;
  const glProjectId = Number(entityConnection.entity_id);
  const glImagePrefix = encodeURI(
    env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/assets/${glIntegrationKey.toLowerCase()}/`
  );
  const issueImagePrefix = glImagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id;
  const issueStateMap = entityConnection.config.states?.issueEventMapping;
  const transformedGitlabIssue = await transformPlaneIssue(
    issue,
    issueImagePrefix,
    labels,
    glService,
    credentials.source_access_token ?? "",
    issueStateMap,
    planeClient,
    entityConnection.workspace_slug,
    entityConnection.project_id ?? "",
    env.API_BASE_URL,
    isEnterprise
  );

  // If the issue has already been created with the external source as GITHUB, update the issue
  if (issue.external_id && issue.external_source && issue.external_source === glIntegrationKey) {
    logger.info("Issue already exists in Gitlab, updating the issue", { issueId: issue.id, glIntegrationKey });
    const glIssueId = issue.external_id.split("_").at(-1);
    return await glService.updateIssue(glProjectId, Number(glIssueId), transformedGitlabIssue);
  } else {
    const createdIssue = await glService.createIssue(glProjectId, transformedGitlabIssue as GitlabIssue);

    const project = await planeClient.project.getProject(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? ""
    );

    const issueUrl = getIssueUrlFromSequenceId(
      entityConnection.workspace_slug,
      project.identifier ?? "",
      issue.sequence_id.toString()
    );
    const comment = `${GITLAB_ISSUE_LINKED_COMMENT_PREFIX}Synced with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[[${project.identifier}-${issue.sequence_id}] ${issue.name}](${issueUrl})`;
    await glService.createIssueComment(glProjectId, Number(createdIssue.iid), comment);

    return createdIssue;
  }
};

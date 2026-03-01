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

import type { Client, ExIssue, ExIssueComment, ExIssueLabel, PlaneWebhookPayload } from "@plane/sdk";
import type {
  TGitlabEntityConnection,
  TGitlabIssueLinkEntityConnection,
  TGitlabWorkspaceConnection,
  TWorkspaceCredential,
} from "@plane/types";
import type { Store } from "@/worker/base";
import type { GitLabService } from "@plane/etl/gitlab";
import type { GitlabContentParserConfig } from "@/apps/gitlab/helpers/content-parser";
import { EGitlabEntityConnectionType } from "@plane/etl/gitlab";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { GITLAB_ISSUE_COMMENT_CACHE_KEY, PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY } from "@/apps/gitlab/helpers/cache-keys";
import { getConnDetailsForPlaneToGitlabSync } from "@/apps/gitlab/helpers/connection-details";
import { shouldSyncPlaneToGitlab } from "@/apps/gitlab/helpers/helpers";
import { getGitlabClientService } from "@/apps/gitlab/services";
import { getGitlabContentParser } from "@/apps/gitlab/helpers/content-parser";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

export const handleIssueCommentWebhook = async (store: Store, payload: PlaneWebhookPayload) => {
  const payloadId = payload?.id ?? "";

  // Check if this webhook was triggered by our own Gitlab->Plane sync (loop prevention)
  if (payloadId) {
    const exist = await store.get(PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY(payload.id));
    if (exist) {
      logger.info("[PLANE][COMMENT] Event triggered by Gitlab->Plane sync, skipping to prevent loop");
      // Remove the key so future legitimate webhooks are not blocked
      await store.del(PLANE_GITLAB_ISSUE_COMMENT_CACHE_KEY(payload.id));
      return true;
    }
  }

  await handleCommentSync(store, payload);
};

const handleCommentSync = async (store: Store, payload: PlaneWebhookPayload) => {
  try {
    const glIntegrationKey = payload.isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB;
    const result = await getConnDetailsForPlaneToGitlabSync(payload.workspace, payload.project, payload.isEnterprise);
    if (!result) {
      logger.info(`${glIntegrationKey} No credential or entity connection or workspace connection found, skipping`, {
        workspace: payload.workspace,
        project: payload.project,
      });
      return;
    }

    const { workspaceConnection, entityConnection, credentials } = result;
    // Check if bidirectional sync is enabled
    if (!entityConnection.config.allowBidirectionalSync) {
      logger.info(`${glIntegrationKey} Bidirectional sync is disabled, skipping issue comment sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
      });
      return;
    }

    // Get the Plane API client
    const planeClient = await getPlaneAPIClient(credentials, glIntegrationKey);

    // Get the issue associated with the comment
    const issue = await planeClient.issue.getIssue(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      payload.issue
    );

    if (!issue || !issue.external_id || !issue.external_source) {
      return logger.info(`${glIntegrationKey} Issue ${payload.issue} not synced with Gitlab, aborting comment sync`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
        issueId: payload.issue,
      });
    }

    if (!shouldSyncPlaneToGitlab(issue.labels as unknown as ExIssueLabel[])) {
      logger.info(`${glIntegrationKey} Issue doesn't have a gitlab label, skipping comment sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
        issueId: payload.issue,
      });
      return;
    }

    const issueLinkEntityConnection = (await integrationConnectionHelper.getIssueLinkEntityConnection({
      entity_id: issue.external_id,
      project_id: entityConnection.project_id ?? "",
      issue_id: issue.id,
      type: EGitlabEntityConnectionType.ISSUE_LINK,
      entity_type: glIntegrationKey,
    })) as TGitlabIssueLinkEntityConnection;

    if (!issueLinkEntityConnection?.config?.comment_id) {
      logger.info(`${glIntegrationKey} Issue link entity connection not found, skipping comment sync via Plane`, {
        workspace: payload.workspace,
        project: payload.project,
        entityConnectionId: entityConnection.id,
        glIntegrationKey,
      });
      return;
    }

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

    const comment = await planeClient.issueComment.getComment(
      entityConnection.workspace_slug,
      entityConnection.project_id ?? "",
      payload.issue,
      payload.id
    );

    // only sync if the comment is a reply to the issue link entity connection comment else skip
    if (comment.parent !== issueLinkEntityConnection?.config?.comment_id) {
      logger.info(
        `${glIntegrationKey} Comment is not a reply to the issue link entity connection comment, skipping comment sync`,
        {
          workspace: payload.workspace,
          project: payload.project,
          entityConnectionId: entityConnection.id,
          glIntegrationKey,
        }
      );
      return;
    }

    const glComment = await createOrUpdateGitlabComment(
      glService,
      issue,
      comment,
      planeClient,
      workspaceConnection,
      entityConnection,
      credentials,
      glIntegrationKey
    );
    // Set key with GitHub comment ID so GitHub->Plane handler can detect and skip
    // Use 5 second TTL to allow the webhook loop back but expire quickly
    const glIssueCommentCacheKey = GITLAB_ISSUE_COMMENT_CACHE_KEY(
      glComment.project_id.toString(),
      issue.external_id.toString(),
      glComment.id.toString()
    );
    await store.set(glIssueCommentCacheKey, "true", 60);

    if (
      !comment.external_id ||
      !comment.external_source ||
      (comment.external_source && comment.external_source !== glIntegrationKey)
    ) {
      await planeClient.issueComment.update(
        entityConnection.workspace_slug,
        entityConnection.project_id ?? "",
        payload.issue,
        payload.id,
        {
          external_id: glComment.id.toString(),
          external_source: glIntegrationKey,
        }
      );
    }
  } catch (error) {
    logger.error("[Plane][Gitlab] Error handling issue comment create/update event", {
      error,
      workspace: payload.workspace,
      project: payload.project,
    });
  }
};

const createOrUpdateGitlabComment = async (
  glService: GitLabService,
  issue: ExIssue,
  comment: ExIssueComment,
  planeClient: Client,
  workspaceConnection: TGitlabWorkspaceConnection,
  entityConnection: TGitlabEntityConnection,
  credentials: TWorkspaceCredential,
  glIntegrationKey: E_INTEGRATION_KEYS
) => {
  const glProjectId = Number(entityConnection.entity_id);
  const isEnterprise = glIntegrationKey === E_INTEGRATION_KEYS.GITLAB_ENTERPRISE;
  const isUpdate = comment.external_id;

  const planeUsers = await planeClient.users.list(
    workspaceConnection.workspace_slug,
    entityConnection.project_id ?? ""
  );
  const actor = planeUsers.find((user) => user.id === comment.actor);

  const glImagePrefix = encodeURI(
    env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/assets/${glIntegrationKey.toLowerCase()}/`
  );
  const assetImagePrefix = glImagePrefix + workspaceConnection.workspace_id + "/" + credentials.user_id;

  let commentHtml = comment.comment_html;
  commentHtml = `${commentHtml} \n\n <p>Comment by ${actor?.display_name} on Plane</p>`;

  const config: GitlabContentParserConfig = {
    planeClient,
    gitlabService: glService,
    workspaceSlug: entityConnection.workspace_slug,
    projectId: entityConnection.project_id ?? "",
    userMap: new Map(),
    fileDownloadHeaders: {
      Authorization: `Bearer ${credentials.source_access_token}`,
    },
    apiBaseUrl: env.API_BASE_URL,
  };
  const contentParser = getGitlabContentParser(config, isEnterprise, env.API_BASE_URL);
  const markdown = contentParser.toMarkdown(commentHtml, assetImagePrefix);
  const glIssueId = issue.external_id.split("_").at(-1);
  const glIssue = await glService.getIssue(glProjectId, Number(glIssueId));

  if (comment.external_id && comment.external_source && comment.external_source === glIntegrationKey) {
    logger.info("Comment already exists in Gitlab, updating the comment", { commentId: comment.id, glIntegrationKey });
    return glService.updateIssueComment(glProjectId, glIssue.iid, Number(comment.external_id), markdown);
  } else {
    return glService.createIssueComment(glProjectId, glIssue.iid, markdown);
  }
};
